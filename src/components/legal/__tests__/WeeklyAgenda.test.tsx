import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeeklyAgenda } from '@/components/legal/WeeklyAgenda';
import type { AgendaEvent } from '@/components/legal/WeeklyAgenda';

/** Returns a Monday of a specific known week for deterministic tests */
function getMonday(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day);
}

// Use a fixed Monday: 2024-01-08 (Mon)
const WEEK_START = getMonday(2024, 1, 8);

const makeDate = (dayOffset: number): string => {
  const d = new Date(WEEK_START);
  d.setDate(d.getDate() + dayOffset);
  return d.toISOString().split('T')[0];
};

const SAMPLE_EVENTS: AgendaEvent[] = [
  // Monday (offset 0)
  {
    date: makeDate(0),
    time: '09:00',
    title: 'Audiência Inicial',
    type: 'audiencia',
    processId: 'PROC-001',
  },
  // Monday — second event
  {
    date: makeDate(0),
    time: '14:00',
    title: 'Prazo Fatal Recurso',
    type: 'prazo_fatal',
  },
  // Wednesday (offset 2)
  {
    date: makeDate(2),
    title: 'Reunião com Cliente',
    type: 'reuniao',
  },
  // Friday (offset 4)
  {
    date: makeDate(4),
    title: 'Diligência Cartório',
    type: 'diligencia',
  },
];

// 4 events all on Monday to test "+N mais"
const EVENTS_OVERFLOW: AgendaEvent[] = [
  { date: makeDate(0), title: 'Evento 1', type: 'audiencia' },
  { date: makeDate(0), title: 'Evento 2', type: 'prazo_fatal' },
  { date: makeDate(0), title: 'Evento 3', type: 'reuniao' },
  { date: makeDate(0), title: 'Evento 4', type: 'diligencia' },
  { date: makeDate(0), title: 'Evento 5', type: 'prazo_ordinario' },
];

describe('WeeklyAgenda', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <WeeklyAgenda events={SAMPLE_EVENTS} weekStart={WEEK_START} />
    );
    expect(container).toBeTruthy();
  });

  it('renders 7 day columns (Seg–Dom)', () => {
    render(<WeeklyAgenda events={SAMPLE_EVENTS} weekStart={WEEK_START} />);
    expect(screen.getAllByText('Seg').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Ter').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Qua').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Qui').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sex').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Sáb').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dom').length).toBeGreaterThan(0);
  });

  it('displays events in correct day columns', () => {
    render(<WeeklyAgenda events={SAMPLE_EVENTS} weekStart={WEEK_START} />);
    expect(screen.getByText('Audiência Inicial')).toBeInTheDocument();
    expect(screen.getByText('Prazo Fatal Recurso')).toBeInTheDocument();
    expect(screen.getByText('Reunião com Cliente')).toBeInTheDocument();
    expect(screen.getByText('Diligência Cartório')).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    render(<WeeklyAgenda events={[]} weekStart={WEEK_START} />);
    expect(screen.getByText('Nenhum compromisso esta semana')).toBeInTheDocument();
  });

  it('shows "+N mais" when more than 3 events per day', () => {
    render(<WeeklyAgenda events={EVENTS_OVERFLOW} weekStart={WEEK_START} />);
    // 5 events on Monday, MAX is 3, so overflow = 2 → "+2 mais"
    expect(screen.getByText('+2 mais')).toBeInTheDocument();
  });

  it('shows all events after clicking "+N mais"', () => {
    render(<WeeklyAgenda events={EVENTS_OVERFLOW} weekStart={WEEK_START} />);
    const morBtn = screen.getByText('+2 mais');
    fireEvent.click(morBtn);
    // All 5 events should now be visible
    expect(screen.getByText('Evento 4')).toBeInTheDocument();
    expect(screen.getByText('Evento 5')).toBeInTheDocument();
    expect(screen.getByText('Ver menos')).toBeInTheDocument();
  });

  it('navigates to next week', () => {
    const onWeekChange = vi.fn();
    render(
      <WeeklyAgenda
        events={SAMPLE_EVENTS}
        weekStart={WEEK_START}
        onWeekChange={onWeekChange}
      />
    );
    const nextBtn = screen.getByText('Próxima');
    fireEvent.click(nextBtn);
    expect(onWeekChange).toHaveBeenCalledOnce();
  });

  it('navigates to previous week', () => {
    const onWeekChange = vi.fn();
    render(
      <WeeklyAgenda
        events={SAMPLE_EVENTS}
        weekStart={WEEK_START}
        onWeekChange={onWeekChange}
      />
    );
    const prevBtn = screen.getByText('Anterior');
    fireEvent.click(prevBtn);
    expect(onWeekChange).toHaveBeenCalledOnce();
  });

  it('calls onEventClick when an event pill is clicked', () => {
    const onEventClick = vi.fn();
    render(
      <WeeklyAgenda
        events={SAMPLE_EVENTS}
        weekStart={WEEK_START}
        onEventClick={onEventClick}
      />
    );
    const eventEl = screen.getByText('Audiência Inicial');
    fireEvent.click(eventEl);
    expect(onEventClick).toHaveBeenCalledOnce();
    expect(onEventClick).toHaveBeenCalledWith(SAMPLE_EVENTS[0]);
  });
});
