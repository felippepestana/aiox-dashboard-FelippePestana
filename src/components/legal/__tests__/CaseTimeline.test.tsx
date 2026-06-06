import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaseTimeline } from '@/components/legal/CaseTimeline';
import type { TimelineMovement } from '@/components/legal/CaseTimeline';

const SAMPLE_MOVEMENTS: TimelineMovement[] = [
  {
    date: '2024-03-15',
    type: 'decisao',
    title: 'Decisão Interlocutória',
    description: 'O juízo decidiu pelo prosseguimento do feito.',
    tribunal: 'TJSP — 3ª Vara Cível',
    author: 'Dr. Silva',
  },
  {
    date: '2024-02-10',
    type: 'despacho',
    title: 'Despacho de Intimação',
    description: 'Intime-se a parte contrária.',
    tribunal: 'TJSP — 3ª Vara Cível',
  },
  {
    date: '2024-01-20',
    type: 'peticao',
    title: 'Petição Inicial',
    description: 'Distribuição da ação principal.',
    tribunal: 'TJSP — 3ª Vara Cível',
  },
  {
    date: '2024-04-05',
    type: 'audiencia',
    title: 'Audiência de Instrução',
    description: 'Audiência de instrução e julgamento designada.',
    tribunal: 'TJSP — 3ª Vara Cível',
  },
  {
    date: '2024-03-01',
    type: 'publicacao',
    title: 'Publicação no DJe',
    description: 'Publicação do despacho no Diário da Justiça.',
    tribunal: 'TJSP — 3ª Vara Cível',
  },
];

describe('CaseTimeline', () => {
  it('renders without crashing', () => {
    const { container } = render(<CaseTimeline movements={SAMPLE_MOVEMENTS} />);
    expect(container).toBeTruthy();
  });

  it('renders correct number of movement cards', () => {
    render(<CaseTimeline movements={SAMPLE_MOVEMENTS} />);
    // Each movement title should appear once
    expect(screen.getByText('Decisão Interlocutória')).toBeInTheDocument();
    expect(screen.getByText('Despacho de Intimação')).toBeInTheDocument();
    expect(screen.getByText('Petição Inicial')).toBeInTheDocument();
    expect(screen.getByText('Audiência de Instrução')).toBeInTheDocument();
    expect(screen.getByText('Publicação no DJe')).toBeInTheDocument();
  });

  it('renders empty state when no movements', () => {
    render(<CaseTimeline movements={[]} />);
    expect(screen.getByText('Nenhuma movimentação registrada')).toBeInTheDocument();
  });

  it('displays movement type badges for decisao', () => {
    render(<CaseTimeline movements={[SAMPLE_MOVEMENTS[0]]} />);
    expect(screen.getByText('Decisão')).toBeInTheDocument();
  });

  it('displays movement type badges for despacho', () => {
    render(<CaseTimeline movements={[SAMPLE_MOVEMENTS[1]]} />);
    expect(screen.getByText('Despacho')).toBeInTheDocument();
  });

  it('displays movement type badges for peticao', () => {
    render(<CaseTimeline movements={[SAMPLE_MOVEMENTS[2]]} />);
    expect(screen.getByText('Petição')).toBeInTheDocument();
  });

  it('displays movement type badges for audiencia', () => {
    render(<CaseTimeline movements={[SAMPLE_MOVEMENTS[3]]} />);
    expect(screen.getByText('Audiência')).toBeInTheDocument();
  });

  it('displays movement type badges for publicacao', () => {
    render(<CaseTimeline movements={[SAMPLE_MOVEMENTS[4]]} />);
    expect(screen.getByText('Publicação')).toBeInTheDocument();
  });

  it('displays movement description', () => {
    render(<CaseTimeline movements={[SAMPLE_MOVEMENTS[0]]} />);
    expect(screen.getByText('O juízo decidiu pelo prosseguimento do feito.')).toBeInTheDocument();
  });

  it('displays tribunal', () => {
    render(<CaseTimeline movements={[SAMPLE_MOVEMENTS[0]]} />);
    expect(screen.getAllByText('TJSP — 3ª Vara Cível').length).toBeGreaterThan(0);
  });

  it('displays author when provided', () => {
    render(<CaseTimeline movements={[SAMPLE_MOVEMENTS[0]]} />);
    expect(screen.getByText('Dr. Silva')).toBeInTheDocument();
  });

  it('does not display author when not provided', () => {
    render(<CaseTimeline movements={[SAMPLE_MOVEMENTS[1]]} />);
    // SAMPLE_MOVEMENTS[1] has no author field
    expect(screen.queryByText('Dr. Silva')).not.toBeInTheDocument();
  });
});
