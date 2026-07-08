// Shared client/server types. These mirror the Prisma models but are the
// serialised (JSON) shapes the API returns, so dates are ISO strings.

export type Priority = 'P1' | 'P2' | 'P3' | 'P4';

export interface LabelDTO {
  id: string;
  name: string;
  color: string;
}

export interface TaskDTO {
  id: string;
  projectId: string;
  sectionId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string;
  dueDate: string | null; // ISO date
  dueTime: string | null; // "HH:mm"
  deadline: string | null;
  priority: Priority;
  recurrence: string | null;
  estimatedMin: number | null;
  completed: boolean;
  completedAt: string | null;
  order: number;
  createdAt: string;
  labels: LabelDTO[];
  subtaskCount?: number;
  completedSubtaskCount?: number;
}

export interface SectionDTO {
  id: string;
  projectId: string;
  name: string;
  order: number;
}

export interface ProjectDTO {
  id: string;
  name: string;
  color: string;
  icon: string;
  isInbox: boolean;
  favorite: boolean;
  archived: boolean;
  viewType: string;
  order: number;
  sections: SectionDTO[];
  taskCount?: number;
}

export interface FilterDTO {
  id: string;
  name: string;
  query: string;
  color: string;
  favorite: boolean;
  order: number;
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  karma: number;
  streak: number;
  settings: Record<string, unknown>;
}

export const PRIORITY_META: Record<Priority, { label: string; color: string; rank: number }> = {
  P1: { label: 'Priority 1', color: '#e03131', rank: 1 },
  P2: { label: 'Priority 2', color: '#f08c00', rank: 2 },
  P3: { label: 'Priority 3', color: '#1971c2', rank: 3 },
  P4: { label: 'Priority 4', color: '#868e96', rank: 4 },
};
