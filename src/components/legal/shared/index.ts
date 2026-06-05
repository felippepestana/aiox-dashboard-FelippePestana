// =============================================================================
// APEX Legal Design System — Shared Components
// =============================================================================

// Breadcrumbs (auto-detecting or explicit)
export { Breadcrumbs } from './Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbsItem } from './Breadcrumbs';

// PageHeader
export { PageHeader } from './PageHeader';
export type { PageHeaderProps, BreadcrumbItem } from './PageHeader';

// StatCardGrid
export { StatCardGrid } from './StatCardGrid';
export type { StatCardGridProps, StatCardItem } from './StatCardGrid';

// DataTable
export { DataTable } from './DataTable';
export type { DataTableProps, ColumnDef, SortDirection } from './DataTable';

// FilterBar
export { FilterBar } from './FilterBar';
export type { FilterBarProps, FilterConfig, FilterValues, SelectOption } from './FilterBar';

// EmptyState
export { EmptyState } from './EmptyState';
export type { EmptyStateProps, EmptyStateAction } from './EmptyState';

// LoadingState
export { LoadingState } from './LoadingState';
export type { LoadingStateProps } from './LoadingState';

// =============================================================================
// DATA COMPONENTS
// =============================================================================

// CaseTimeline
export { CaseTimeline } from '../CaseTimeline';
export type { CaseTimelineProps, Movement } from '../CaseTimeline';

// ProcessKanban
export { ProcessKanban } from '../ProcessKanban';
export type { ProcessKanbanProps, KanbanProcess, ProcessArea, ProcessStatus, ProcessPriority } from '../ProcessKanban';

// JudgeRadarChart
export { JudgeRadarChart } from '../JudgeRadarChart';
export type { JudgeRadarChartProps, JudgeProfile } from '../JudgeRadarChart';

// CompactDeadlineCalendar
export { CompactDeadlineCalendar } from '../CompactDeadlineCalendar';
export type { CompactDeadlineCalendarProps, CalendarDeadline } from '../CompactDeadlineCalendar';

// =============================================================================
// FORM COMPONENTS
// =============================================================================

// MultiStepForm
export { MultiStepForm } from '../MultiStepForm';
export type { MultiStepFormProps, FormStep } from '../MultiStepForm';

// ClientSelector
export { ClientSelector } from '../ClientSelector';
export type { ClientSelectorProps, Client } from '../ClientSelector';
