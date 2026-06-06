import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '@/components/legal/shared/EmptyState';

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe('EmptyState', () => {
  it('renders without crashing', () => {
    const { container } = render(<EmptyState title="Sem dados" />);
    expect(container).toBeTruthy();
  });

  it('displays title', () => {
    render(<EmptyState title="Nenhum processo encontrado" />);
    expect(screen.getByText('Nenhum processo encontrado')).toBeInTheDocument();
  });

  it('displays description when provided', () => {
    render(
      <EmptyState
        title="Nenhum processo"
        description="Adicione um processo para começar."
      />
    );
    expect(screen.getByText('Adicione um processo para começar.')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="Nenhum processo" />);
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('renders action button when onClick is provided', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Sem processos"
        action={{ label: 'Novo Processo', onClick }}
      />
    );
    const button = screen.getByText('Novo Processo');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('renders action link when href is provided', () => {
    render(
      <EmptyState
        title="Sem processos"
        action={{ label: 'Ir para Processos', href: '/legal/processes' }}
      />
    );
    const link = screen.getByText('Ir para Processos');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/legal/processes');
  });

  it('renders icon when provided', () => {
    render(
      <EmptyState
        title="Sem dados"
        icon={<span data-testid="custom-icon">icon</span>}
      />
    );
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('does not render icon container when icon is not provided', () => {
    const { container } = render(<EmptyState title="Sem dados" />);
    // The icon circle div should not be rendered
    const iconDiv = container.querySelector('.h-16.w-16.rounded-full');
    expect(iconDiv).not.toBeInTheDocument();
  });

  it('renders action as button (not link) when href is absent', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        title="Sem dados"
        action={{ label: 'Criar', onClick }}
      />
    );
    const btn = screen.getByText('Criar');
    expect(btn.tagName.toLowerCase()).toBe('button');
  });
});
