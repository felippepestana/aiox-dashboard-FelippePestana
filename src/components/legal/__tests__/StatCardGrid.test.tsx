import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCardGrid } from '@/components/legal/shared/StatCardGrid';
import type { StatCardItem } from '@/components/legal/shared/StatCardGrid';

const SAMPLE_CARDS: StatCardItem[] = [
  {
    label: 'Processos Ativos',
    value: 42,
    trend: 'up',
    trendLabel: '+5%',
  },
  {
    label: 'Clientes',
    value: '128',
    trend: 'down',
    trendLabel: '-2%',
  },
  {
    label: 'Honorários',
    value: 'R$ 15.000',
    trend: 'flat',
  },
  {
    label: 'Prazos Vencendo',
    value: 7,
  },
];

describe('StatCardGrid', () => {
  it('renders without crashing', () => {
    const { container } = render(<StatCardGrid cards={SAMPLE_CARDS} />);
    expect(container).toBeTruthy();
  });

  it('renders correct number of cards', () => {
    render(<StatCardGrid cards={SAMPLE_CARDS} />);
    expect(screen.getByText('Processos Ativos')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Honorários')).toBeInTheDocument();
    expect(screen.getByText('Prazos Vencendo')).toBeInTheDocument();
  });

  it('displays card values', () => {
    render(<StatCardGrid cards={SAMPLE_CARDS} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('R$ 15.000')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('displays card labels', () => {
    render(<StatCardGrid cards={SAMPLE_CARDS} />);
    expect(screen.getByText('Processos Ativos')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
  });

  it('shows trend label for up trend', () => {
    render(<StatCardGrid cards={[SAMPLE_CARDS[0]]} />);
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('shows trend label for down trend', () => {
    render(<StatCardGrid cards={[SAMPLE_CARDS[1]]} />);
    expect(screen.getByText('-2%')).toBeInTheDocument();
  });

  it('shows trend indicator with aria-label for up trend', () => {
    render(<StatCardGrid cards={[SAMPLE_CARDS[0]]} />);
    expect(screen.getByLabelText(/Tendência/i)).toBeInTheDocument();
  });

  it('does not render trend indicator for flat trend without trendLabel', () => {
    const flatCard: StatCardItem = { label: 'Test', value: 0, trend: 'flat' };
    const { container } = render(<StatCardGrid cards={[flatCard]} />);
    // No aria-label for flat trend
    expect(screen.queryByLabelText(/Tendência/i)).not.toBeInTheDocument();
  });

  it('returns null when cards array is empty', () => {
    const { container } = render(<StatCardGrid cards={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('returns null when cards prop is not provided (falsy)', () => {
    // @ts-expect-error testing falsy input
    const { container } = render(<StatCardGrid cards={null} />);
    expect(container.innerHTML).toBe('');
  });
});
