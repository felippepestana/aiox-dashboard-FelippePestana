import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompactDeadlineCalendar } from '@/components/legal/CompactDeadlineCalendar';
import type { CalendarDeadline } from '@/components/legal/CompactDeadlineCalendar';

// Use a fixed month for deterministic tests: March 2024
const MARCH_2024 = new Date(2024, 2, 1); // month is 0-indexed

const SAMPLE_DEADLINES: CalendarDeadline[] = [
  {
    date: '2024-03-05',
    title: 'Prazo Fatal — Recurso',
    type: 'fatal',
    processId: 'PROC-001',
  },
  {
    date: '2024-03-15',
    title: 'Audiência de Instrução',
    type: 'audiencia',
    processId: 'PROC-002',
  },
  {
    date: '2024-03-20',
    title: 'Prazo Ordinário',
    type: 'ordinario',
  },
  {
    date: '2024-03-05',
    title: 'Segundo Prazo no Dia 5',
    type: 'ordinario',
  },
];

describe('CompactDeadlineCalendar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <CompactDeadlineCalendar deadlines={SAMPLE_DEADLINES} month={MARCH_2024} />
    );
    expect(container).toBeTruthy();
  });

  it('renders month name', () => {
    render(
      <CompactDeadlineCalendar deadlines={SAMPLE_DEADLINES} month={MARCH_2024} />
    );
    expect(screen.getByText('Março 2024')).toBeInTheDocument();
  });

  it('renders navigation arrows', () => {
    render(
      <CompactDeadlineCalendar deadlines={SAMPLE_DEADLINES} month={MARCH_2024} />
    );
    expect(screen.getByLabelText('Mês anterior')).toBeInTheDocument();
    expect(screen.getByLabelText('Próximo mês')).toBeInTheDocument();
  });

  it('renders 7 day column headers (Dom–Sáb)', () => {
    render(
      <CompactDeadlineCalendar deadlines={SAMPLE_DEADLINES} month={MARCH_2024} />
    );
    const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    for (const label of DAY_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('navigates to next month when next arrow is clicked', () => {
    const onMonthChange = vi.fn();
    render(
      <CompactDeadlineCalendar
        deadlines={[]}
        month={MARCH_2024}
        onMonthChange={onMonthChange}
      />
    );
    const nextBtn = screen.getByLabelText('Próximo mês');
    fireEvent.click(nextBtn);
    expect(onMonthChange).toHaveBeenCalledOnce();
    // The displayed month should now be April 2024
    expect(screen.getByText('Abril 2024')).toBeInTheDocument();
  });

  it('navigates to previous month when prev arrow is clicked', () => {
    const onMonthChange = vi.fn();
    render(
      <CompactDeadlineCalendar
        deadlines={[]}
        month={MARCH_2024}
        onMonthChange={onMonthChange}
      />
    );
    const prevBtn = screen.getByLabelText('Mês anterior');
    fireEvent.click(prevBtn);
    expect(onMonthChange).toHaveBeenCalledOnce();
    expect(screen.getByText('Fevereiro 2024')).toBeInTheDocument();
  });

  it('shows deadline dots on dates with deadlines', () => {
    const { container } = render(
      <CompactDeadlineCalendar deadlines={SAMPLE_DEADLINES} month={MARCH_2024} />
    );
    // Day cells with deadlines get dot spans with colored background classes
    const redDots = container.querySelectorAll('.bg-\\[\\#F87171\\]');
    expect(redDots.length).toBeGreaterThan(0);
  });

  it('renders legend with deadline type labels', () => {
    render(
      <CompactDeadlineCalendar deadlines={SAMPLE_DEADLINES} month={MARCH_2024} />
    );
    expect(screen.getByText('Fatal')).toBeInTheDocument();
    expect(screen.getByText('Audiência')).toBeInTheDocument();
    expect(screen.getByText('Ordinário')).toBeInTheDocument();
  });

  it('calls onDateClick when a date with deadlines is clicked', () => {
    const onDateClick = vi.fn();
    render(
      <CompactDeadlineCalendar
        deadlines={SAMPLE_DEADLINES}
        month={MARCH_2024}
        onDateClick={onDateClick}
      />
    );
    // Day 5 has deadlines — find it by its aria-label
    const day5 = screen.getByLabelText(/^5, \d+ prazo/);
    fireEvent.click(day5);
    expect(onDateClick).toHaveBeenCalledOnce();
  });

  it('renders all days of March 2024 (1–31)', () => {
    render(
      <CompactDeadlineCalendar deadlines={[]} month={MARCH_2024} />
    );
    // March has 31 days; all should have aria-labels
    // Some padding cells from adjacent months may share numbers, so use getAllByLabelText
    const day31 = screen.getAllByLabelText('31');
    expect(day31.length).toBeGreaterThan(0);
    const day15 = screen.getAllByLabelText('15');
    expect(day15.length).toBeGreaterThan(0);
  });
});
