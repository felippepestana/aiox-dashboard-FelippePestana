import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FilterBar } from '@/components/legal/shared/FilterBar';
import type { FilterConfig, FilterValues } from '@/components/legal/shared/FilterBar';

const FILTERS: FilterConfig[] = [
  {
    type: 'select',
    key: 'status',
    label: 'Status',
    options: [
      { label: 'Ativo',    value: 'ativo'    },
      { label: 'Inativo',  value: 'inativo'  },
      { label: 'Pendente', value: 'pendente' },
    ],
  },
  {
    type: 'search',
    key: 'query',
    placeholder: 'Buscar processos...',
  },
];

describe('FilterBar', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <FilterBar filters={FILTERS} onFilterChange={vi.fn()} onClear={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it('renders select filter with options', () => {
    render(
      <FilterBar filters={FILTERS} onFilterChange={vi.fn()} onClear={vi.fn()} />
    );
    const select = screen.getByTitle('Status');
    expect(select).toBeInTheDocument();
    expect(screen.getByText('Ativo')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
    expect(screen.getByText('Pendente')).toBeInTheDocument();
  });

  it('renders search filter with placeholder', () => {
    render(
      <FilterBar filters={FILTERS} onFilterChange={vi.fn()} onClear={vi.fn()} />
    );
    expect(screen.getByPlaceholderText('Buscar processos...')).toBeInTheDocument();
  });

  it('calls onFilterChange when select filter value changes', () => {
    const onFilterChange = vi.fn();
    render(
      <FilterBar filters={FILTERS} onFilterChange={onFilterChange} onClear={vi.fn()} />
    );
    const select = screen.getByTitle('Status');
    fireEvent.change(select, { target: { value: 'ativo' } });
    expect(onFilterChange).toHaveBeenCalledWith('status', 'ativo');
  });

  it('calls onFilterChange when search filter value changes', () => {
    const onFilterChange = vi.fn();
    render(
      <FilterBar filters={FILTERS} onFilterChange={onFilterChange} onClear={vi.fn()} />
    );
    const searchInput = screen.getByPlaceholderText('Buscar processos...');
    fireEvent.change(searchInput, { target: { value: 'processo teste' } });
    expect(onFilterChange).toHaveBeenCalledWith('query', 'processo teste');
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    const activeValues: FilterValues = { status: 'ativo', query: '' };
    render(
      <FilterBar
        filters={FILTERS}
        values={activeValues}
        onFilterChange={vi.fn()}
        onClear={onClear}
      />
    );
    // The desktop clear button is "Limpar filtros"
    const clearBtn = screen.getByText('Limpar filtros');
    fireEvent.click(clearBtn);
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('shows active filter count badge when filters are active', () => {
    const activeValues: FilterValues = { status: 'ativo', query: 'teste' };
    render(
      <FilterBar
        filters={FILTERS}
        values={activeValues}
        onFilterChange={vi.fn()}
        onClear={vi.fn()}
      />
    );
    // Active count should be 2 (both status and query have values)
    const badges = screen.getAllByText('2');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('does not show clear button when no filters are active', () => {
    render(
      <FilterBar
        filters={FILTERS}
        values={{}}
        onFilterChange={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.queryByText('Limpar filtros')).not.toBeInTheDocument();
  });

  it('uses default placeholder when search filter has no placeholder', () => {
    const filtersNoPlaceholder: FilterConfig[] = [
      { type: 'search', key: 'q' },
    ];
    render(
      <FilterBar
        filters={filtersNoPlaceholder}
        onFilterChange={vi.fn()}
        onClear={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });
});
