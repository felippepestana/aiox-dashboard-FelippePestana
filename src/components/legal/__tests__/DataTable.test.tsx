import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable } from '@/components/legal/shared/DataTable';
import type { ColumnDef } from '@/components/legal/shared/DataTable';

interface SampleRow extends Record<string, unknown> {
  id: string;
  name: string;
  status: string;
  amount: number;
}

const COLUMNS: ColumnDef<SampleRow>[] = [
  { key: 'name',   label: 'Nome',   sortable: true },
  { key: 'status', label: 'Status', sortable: false },
  { key: 'amount', label: 'Valor',  sortable: true },
];

const DATA: SampleRow[] = [
  { id: '1', name: 'Alice',   status: 'ativo',      amount: 500 },
  { id: '2', name: 'Carlos',  status: 'inativo',    amount: 1200 },
  { id: '3', name: 'Beatriz', status: 'pendente',   amount: 800 },
];

describe('DataTable', () => {
  it('renders without crashing', () => {
    const { container } = render(<DataTable columns={COLUMNS} data={DATA} />);
    expect(container).toBeTruthy();
  });

  it('renders column headers', () => {
    render(<DataTable columns={COLUMNS} data={DATA} />);
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Valor')).toBeInTheDocument();
  });

  it('renders data rows', () => {
    render(<DataTable columns={COLUMNS} data={DATA} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Carlos')).toBeInTheDocument();
    expect(screen.getByText('Beatriz')).toBeInTheDocument();
    expect(screen.getByText('ativo')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('sorts ascending by column when sortable header is clicked', () => {
    render(<DataTable columns={COLUMNS} data={DATA} />);
    const nameHeader = screen.getByText('Nome');
    fireEvent.click(nameHeader);

    const rows = screen.getAllByRole('row');
    // Header row + data rows; first data row (index 1) should be Alice after asc sort
    expect(rows[1]).toHaveTextContent('Alice');
    expect(rows[2]).toHaveTextContent('Beatriz');
    expect(rows[3]).toHaveTextContent('Carlos');
  });

  it('sorts descending when sortable header is clicked twice', () => {
    render(<DataTable columns={COLUMNS} data={DATA} />);
    const nameHeader = screen.getByText('Nome');
    fireEvent.click(nameHeader); // asc
    fireEvent.click(nameHeader); // desc

    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Carlos');
    expect(rows[2]).toHaveTextContent('Beatriz');
    expect(rows[3]).toHaveTextContent('Alice');
  });

  it('does not sort when non-sortable header is clicked', () => {
    render(<DataTable columns={COLUMNS} data={DATA} />);
    const statusHeader = screen.getByText('Status');
    fireEvent.click(statusHeader);
    // Data order should remain unchanged
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Alice');
    expect(rows[2]).toHaveTextContent('Carlos');
    expect(rows[3]).toHaveTextContent('Beatriz');
  });

  it('shows empty message when no data', () => {
    render(<DataTable columns={COLUMNS} data={[]} />);
    expect(screen.getByText('Nenhum registro encontrado.')).toBeInTheDocument();
  });

  it('shows custom empty message when provided', () => {
    render(
      <DataTable
        columns={COLUMNS}
        data={[]}
        emptyMessage="Sem resultados para exibir."
      />
    );
    expect(screen.getByText('Sem resultados para exibir.')).toBeInTheDocument();
  });

  it('renders custom cell content via render prop', () => {
    const customColumns: ColumnDef<SampleRow>[] = [
      { key: 'name',   label: 'Nome'   },
      {
        key: 'status',
        label: 'Status Badge',
        render: (value) => <span data-testid="custom-cell">{String(value).toUpperCase()}</span>,
      },
    ];
    render(<DataTable columns={customColumns} data={[DATA[0]]} />);
    const customCells = screen.getAllByTestId('custom-cell');
    expect(customCells.length).toBeGreaterThan(0);
    expect(customCells[0]).toHaveTextContent('ATIVO');
  });

  it('calls onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={COLUMNS} data={DATA} onRowClick={onRowClick} />);
    const aliceRow = screen.getByText('Alice').closest('tr');
    expect(aliceRow).toBeTruthy();
    fireEvent.click(aliceRow!);
    expect(onRowClick).toHaveBeenCalledOnce();
    expect(onRowClick).toHaveBeenCalledWith(DATA[0]);
  });
});
