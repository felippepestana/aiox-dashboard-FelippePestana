import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// jsdom does not implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock next/navigation before importing anything that uses it
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/legal',
}));

// Mock the useCommandPalette hook so we control open/close/query state
const mockClose = vi.fn();
const mockOpen = vi.fn();
const mockSetQuery = vi.fn();
const mockExecuteResult = vi.fn();

const mockHookState = {
  isOpen: false,
  query: '',
  results: [] as Array<{
    id: string;
    type: string;
    title: string;
    subtitle?: string;
    href?: string;
    icon?: string;
  }>,
};

vi.mock('@/hooks/useCommandPalette', () => ({
  useCommandPalette: () => ({
    isOpen: mockHookState.isOpen,
    open: mockOpen,
    close: mockClose,
    toggle: vi.fn(),
    query: mockHookState.query,
    setQuery: mockSetQuery,
    results: mockHookState.results,
    executeResult: mockExecuteResult,
  }),
}));

import { CommandPalette } from '@/components/legal/CommandPalette';

const QUICK_ACTIONS = [
  { id: 'action-new-process', type: 'action', title: 'Novo Processo', subtitle: 'Cadastrar novo processo', href: '/legal/processes/new', icon: 'FilePlus' },
  { id: 'action-new-client',  type: 'action', title: 'Novo Cliente',  subtitle: 'Cadastrar novo cliente',  href: '/legal/clients/new',   icon: 'UserPlus' },
];

describe('CommandPalette', () => {
  beforeEach(() => {
    mockHookState.isOpen = false;
    mockHookState.query = '';
    mockHookState.results = [];
    mockClose.mockClear();
    mockOpen.mockClear();
    mockSetQuery.mockClear();
    mockExecuteResult.mockClear();
  });

  it('does not render when isOpen is false', () => {
    mockHookState.isOpen = false;
    const { container } = render(<CommandPalette />);
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    mockHookState.isOpen = true;
    mockHookState.results = QUICK_ACTIONS;
    render(<CommandPalette />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('shows search input', () => {
    mockHookState.isOpen = true;
    mockHookState.results = [];
    render(<CommandPalette />);
    const input = screen.getByPlaceholderText('Buscar páginas, processos, clientes...');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text');
  });

  it('filters results based on query — shows matching results', () => {
    mockHookState.isOpen = true;
    mockHookState.query = 'dashboard';
    mockHookState.results = [
      { id: 'page-dashboard', type: 'page', title: 'Dashboard', href: '/legal', icon: 'LayoutDashboard' },
    ];

    render(<CommandPalette />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Novo Processo')).not.toBeInTheDocument();
  });

  it('shows default quick actions when query is short', () => {
    mockHookState.isOpen = true;
    mockHookState.query = '';
    mockHookState.results = QUICK_ACTIONS;

    render(<CommandPalette />);
    expect(screen.getByText('Novo Processo')).toBeInTheDocument();
    expect(screen.getByText('Novo Cliente')).toBeInTheDocument();
  });

  it('shows empty state prompt when query is short', () => {
    mockHookState.isOpen = true;
    mockHookState.query = 'x'; // < 2 chars triggers "Comece a digitar"
    mockHookState.results = [];

    render(<CommandPalette />);
    expect(screen.getByText('Comece a digitar para buscar...')).toBeInTheDocument();
  });

  it('shows no result message for unmatched query', () => {
    mockHookState.isOpen = true;
    mockHookState.query = 'xyznotfound';
    mockHookState.results = [];

    render(<CommandPalette />);
    expect(
      screen.getByText(/Nenhum resultado para "xyznotfound"/)
    ).toBeInTheDocument();
  });

  it('calls setQuery when input value changes', () => {
    mockHookState.isOpen = true;
    mockHookState.results = [];
    render(<CommandPalette />);

    const input = screen.getByPlaceholderText('Buscar páginas, processos, clientes...');
    fireEvent.change(input, { target: { value: 'processo' } });
    expect(mockSetQuery).toHaveBeenCalledWith('processo');
  });

  it('calls close when backdrop is clicked', () => {
    mockHookState.isOpen = true;
    mockHookState.results = [];
    render(<CommandPalette />);

    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop);
    expect(mockClose).toHaveBeenCalledOnce();
  });

  it('renders group headers for grouped results', () => {
    mockHookState.isOpen = true;
    mockHookState.query = 'novo';
    mockHookState.results = [
      { id: 'action-new-process', type: 'action', title: 'Novo Processo', icon: 'FilePlus' },
      { id: 'page-processes', type: 'page', title: 'Processos', href: '/legal/processes', icon: 'Briefcase' },
    ];
    render(<CommandPalette />);
    // Type group labels
    expect(screen.getByText('Ações')).toBeInTheDocument();
    expect(screen.getByText('Páginas')).toBeInTheDocument();
  });
});
