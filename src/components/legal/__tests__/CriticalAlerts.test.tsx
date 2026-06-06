import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CriticalAlerts } from '@/components/legal/CriticalAlerts';
import type { CriticalAlert } from '@/components/legal/CriticalAlerts';

const SAMPLE_ALERTS: CriticalAlert[] = [
  {
    id: 'a1',
    type: 'prazo_vencido',
    title: 'Prazo Vencido — Recurso',
    description: 'O prazo para interpor recurso venceu ontem.',
    processId: 'PROC-001',
    action: 'Ver processo',
    actionHref: '/legal/processes/1',
  },
  {
    id: 'a2',
    type: 'prazo_hoje',
    title: 'Prazo Fatal Hoje',
    description: 'Prazo para apresentação de defesa vence hoje.',
    processId: 'PROC-002',
    action: 'Ver processo',
    actionHref: '/legal/processes/2',
  },
  {
    id: 'a3',
    type: 'intimacao',
    title: 'Nova Intimação',
    description: 'Intimação recebida pelo sistema do tribunal.',
    action: 'Ver intimação',
    actionHref: '/legal/processes/3',
  },
  {
    id: 'a4',
    type: 'audiencia_amanha',
    title: 'Audiência Amanhã',
    description: 'Audiência de instrução agendada para amanhã.',
    action: 'Ver agenda',
    actionHref: '/legal/processes/4',
  },
  {
    id: 'a5',
    type: 'pagamento_atrasado',
    title: 'Honorários Atrasados',
    description: 'Cliente com pagamento em atraso há 15 dias.',
    action: 'Ver honorários',
    actionHref: '/legal/honorarios/5',
  },
  {
    id: 'a6',
    type: 'prazo_hoje',
    title: 'Outro Prazo Hoje',
    description: 'Mais um prazo vencendo hoje.',
    action: 'Ver',
    actionHref: '/legal/processes/6',
  },
];

describe('CriticalAlerts', () => {
  it('renders without crashing', () => {
    const { container } = render(<CriticalAlerts alerts={SAMPLE_ALERTS} />);
    expect(container).toBeTruthy();
  });

  it('renders alert cards', () => {
    render(<CriticalAlerts alerts={SAMPLE_ALERTS} />);
    expect(screen.getByText('Prazo Vencido — Recurso')).toBeInTheDocument();
    expect(screen.getByText('Prazo Fatal Hoje')).toBeInTheDocument();
  });

  it('shows empty state when no alerts', () => {
    render(<CriticalAlerts alerts={[]} />);
    expect(screen.getByText('Nenhum alerta pendente')).toBeInTheDocument();
  });

  it('limits visible alerts to maxVisible (default 5)', () => {
    render(<CriticalAlerts alerts={SAMPLE_ALERTS} maxVisible={5} />);
    // With 6 alerts and maxVisible=5, only 5 should be visible initially
    // The "Ver todos" button should appear
    expect(screen.getByText(/Ver todos/)).toBeInTheDocument();
  });

  it('shows "Ver todos" when more alerts than maxVisible', () => {
    render(<CriticalAlerts alerts={SAMPLE_ALERTS} maxVisible={3} />);
    expect(screen.getByText(/Ver todos \(6\)/)).toBeInTheDocument();
  });

  it('shows all alerts when "Ver todos" is clicked', () => {
    render(<CriticalAlerts alerts={SAMPLE_ALERTS} maxVisible={3} />);
    const verTodos = screen.getByText(/Ver todos/);
    fireEvent.click(verTodos);
    // After clicking, all 6 alerts should be visible
    expect(screen.getByText('Prazo Vencido — Recurso')).toBeInTheDocument();
    expect(screen.getByText('Outro Prazo Hoje')).toBeInTheDocument();
    // "Ver menos" button should now appear
    expect(screen.getByText('Ver menos')).toBeInTheDocument();
  });

  it('calls onViewAll when provided instead of expanding inline', () => {
    const onViewAll = vi.fn();
    render(
      <CriticalAlerts alerts={SAMPLE_ALERTS} maxVisible={3} onViewAll={onViewAll} />
    );
    const verTodos = screen.getByText(/Ver todos/);
    fireEvent.click(verTodos);
    expect(onViewAll).toHaveBeenCalledOnce();
  });

  it('displays alert count badge in header', () => {
    render(<CriticalAlerts alerts={SAMPLE_ALERTS} />);
    // The count badge shows alerts.length
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('renders alert action links', () => {
    render(<CriticalAlerts alerts={[SAMPLE_ALERTS[0]]} />);
    expect(screen.getByText('Ver processo')).toBeInTheDocument();
  });

  it('renders process ID when provided', () => {
    render(<CriticalAlerts alerts={[SAMPLE_ALERTS[0]]} />);
    expect(screen.getByText('Processo: PROC-001')).toBeInTheDocument();
  });
});
