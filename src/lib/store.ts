'use client';

import { create } from 'zustand';
import { api } from './client';
import { evaluateFilter } from './filterQuery';
import type { TaskDTO, ProjectDTO, LabelDTO, FilterDTO, UserDTO } from './types';

export type ViewKind = 'inbox' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'project' | 'label' | 'filter' | 'search' | 'dashboard';

export interface ActiveView {
  kind: ViewKind;
  id?: string; // project/label/filter id
  title: string;
  query?: string; // search text or filter query
}

export interface Toast {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
}

interface StoreState {
  user: UserDTO | null;
  projects: ProjectDTO[];
  labels: LabelDTO[];
  filters: FilterDTO[];
  tasks: TaskDTO[];
  loading: boolean;
  view: ActiveView;
  selectedTaskId: string | null;
  selectedIds: Set<string>; // bulk selection
  toasts: Toast[];
  search: string;

  bootstrap: () => Promise<void>;
  setView: (view: ActiveView) => Promise<void>;
  refreshTasks: () => Promise<void>;
  setSearch: (q: string) => void;

  createTask: (input: CreateTaskInput) => Promise<void>;
  updateTask: (id: string, patch: Partial<TaskDTO> & { labelNames?: string[] }) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;

  createProject: (name: string, color: string, icon: string) => Promise<ProjectDTO | undefined>;
  updateProject: (id: string, patch: Partial<ProjectDTO>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  createLabel: (name: string, color: string) => Promise<void>;
  createFilter: (name: string, query: string, color: string) => Promise<void>;
  deleteFilter: (id: string) => Promise<void>;

  selectTask: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  clearSelection: () => void;
  bulkComplete: () => Promise<void>;
  bulkDelete: () => Promise<void>;
  bulkMove: (projectId: string) => Promise<void>;

  pushToast: (message: string, action?: Toast['action']) => void;
  dismissToast: (id: string) => void;
  logout: () => Promise<void>;
}

export interface CreateTaskInput {
  title: string;
  projectId?: string;
  parentTaskId?: string | null;
  description?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  priority?: TaskDTO['priority'];
  recurrence?: string | null;
  labelNames?: string[];
  estimatedMin?: number | null;
}

function viewToQuery(view: ActiveView): string {
  const p = new URLSearchParams();
  switch (view.kind) {
    case 'inbox': {
      // handled by projectId lookup; caller sets id to inbox project id.
      if (view.id) p.set('projectId', view.id);
      break;
    }
    case 'today':
      p.set('view', 'today');
      break;
    case 'upcoming':
      p.set('view', 'upcoming');
      break;
    case 'overdue':
      p.set('view', 'overdue');
      break;
    case 'completed':
      p.set('view', 'completed');
      break;
    case 'project':
      if (view.id) p.set('projectId', view.id);
      break;
    case 'label':
      if (view.id) p.set('labelId', view.id);
      break;
    case 'search':
      if (view.query) p.set('search', view.query);
      break;
    case 'filter':
      // Filter query strings are parsed client-side after fetching all active tasks.
      break;
  }
  return p.toString();
}

export const useStore = create<StoreState>((set, get) => ({
  user: null,
  projects: [],
  labels: [],
  filters: [],
  tasks: [],
  loading: true,
  view: { kind: 'today', title: 'Today' },
  selectedTaskId: null,
  selectedIds: new Set(),
  toasts: [],
  search: '',

  bootstrap: async () => {
    set({ loading: true });
    const [{ user }, { projects }, { labels }, { filters }] = await Promise.all([
      api.get<{ user: UserDTO | null }>('/api/auth/me'),
      api.get<{ projects: ProjectDTO[] }>('/api/projects'),
      api.get<{ labels: LabelDTO[] }>('/api/labels'),
      api.get<{ filters: FilterDTO[] }>('/api/filters'),
    ]);
    set({ user, projects, labels, filters });
    await get().setView({ kind: 'today', title: 'Today' });
    set({ loading: false });
  },

  setView: async (view) => {
    // For inbox, attach the inbox project id.
    if (view.kind === 'inbox') {
      const inbox = get().projects.find((p) => p.isInbox);
      view = { ...view, id: inbox?.id };
    }
    set({ view, selectedTaskId: null, selectedIds: new Set() });
    await get().refreshTasks();
  },

  refreshTasks: async () => {
    const { view, projects } = get();
    if (view.kind === 'dashboard') return;
    if (view.kind === 'filter') {
      // Fetch all active tasks and evaluate the saved query client-side.
      const { tasks } = await api.get<{ tasks: TaskDTO[] }>('/api/tasks');
      const ctx = { projectNameById: new Map(projects.map((p) => [p.id, p.name])) };
      const q = view.query ?? '';
      set({ tasks: tasks.filter((t) => evaluateFilter(q, t, ctx)) });
      return;
    }
    const qs = viewToQuery(view);
    const { tasks } = await api.get<{ tasks: TaskDTO[] }>(`/api/tasks${qs ? `?${qs}` : ''}`);
    set({ tasks });
  },

  setSearch: (q) => set({ search: q }),

  createTask: async (input) => {
    const { view, projects } = get();
    // Default project: current project view, else inbox.
    let projectId = input.projectId;
    if (!projectId) {
      if (view.kind === 'project' || view.kind === 'inbox') projectId = view.id;
      else projectId = projects.find((p) => p.isInbox)?.id;
    }
    const { task } = await api.post<{ task: TaskDTO }>('/api/tasks', { ...input, projectId });
    // Only show it in the current view if it belongs there.
    set((s) => ({ tasks: [...s.tasks, task] }));
    await get().refreshTasks();
  },

  updateTask: async (id, patch) => {
    const prev = get().tasks;
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
    try {
      const { task } = await api.patch<{ task: TaskDTO }>(`/api/tasks/${id}`, patch);
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? task : t)) }));
    } catch (e) {
      set({ tasks: prev });
      get().pushToast((e as Error).message);
    }
  },

  toggleComplete: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;
    const nextCompleted = !task.completed;
    const prev = get().tasks;
    const { view } = get();

    // Optimistic: in most views a completed task disappears.
    if (nextCompleted && view.kind !== 'completed') {
      set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
    } else {
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, completed: nextCompleted } : t)) }));
    }

    try {
      await api.patch(`/api/tasks/${id}`, { completed: nextCompleted });
      if (nextCompleted) {
        get().pushToast('Task completed', {
          label: 'Undo',
          onClick: () => get().toggleComplete(id),
        });
      }
    } catch (e) {
      set({ tasks: prev });
      get().pushToast((e as Error).message);
    }
  },

  deleteTask: async (id) => {
    const prev = get().tasks;
    const removed = prev.find((t) => t.id === id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id), selectedTaskId: null }));
    try {
      await api.del(`/api/tasks/${id}`);
      if (removed) get().pushToast('Task deleted');
    } catch (e) {
      set({ tasks: prev });
      get().pushToast((e as Error).message);
    }
  },

  createProject: async (name, color, icon) => {
    const { project } = await api.post<{ project: ProjectDTO }>('/api/projects', { name, color, icon });
    set((s) => ({ projects: [...s.projects, project] }));
    return project;
  },

  updateProject: async (id, patch) => {
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
    const { project } = await api.patch<{ project: ProjectDTO }>(`/api/projects/${id}`, patch);
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? project : p)) }));
  },

  deleteProject: async (id) => {
    const prev = get().projects;
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    try {
      await api.del(`/api/projects/${id}`);
      const { view } = get();
      if (view.kind === 'project' && view.id === id) {
        await get().setView({ kind: 'today', title: 'Today' });
      }
    } catch (e) {
      set({ projects: prev });
      get().pushToast((e as Error).message);
    }
  },

  createLabel: async (name, color) => {
    const { label } = await api.post<{ label: LabelDTO }>('/api/labels', { name, color });
    set((s) => ({ labels: [...s.labels.filter((l) => l.id !== label.id), label].sort((a, b) => a.name.localeCompare(b.name)) }));
  },

  createFilter: async (name, query, color) => {
    const { filter } = await api.post<{ filter: FilterDTO }>('/api/filters', { name, query, color });
    set((s) => ({ filters: [...s.filters, filter] }));
  },

  deleteFilter: async (id) => {
    set((s) => ({ filters: s.filters.filter((f) => f.id !== id) }));
    await api.del(`/api/filters/${id}`);
  },

  selectTask: (id) => set({ selectedTaskId: id }),

  toggleSelect: (id) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { selectedIds: next };
    }),

  clearSelection: () => set({ selectedIds: new Set() }),

  bulkComplete: async () => {
    const ids = [...get().selectedIds];
    set((s) => ({ tasks: s.tasks.filter((t) => !s.selectedIds.has(t.id)), selectedIds: new Set() }));
    await Promise.all(ids.map((id) => api.patch(`/api/tasks/${id}`, { completed: true })));
    get().pushToast(`${ids.length} task(s) completed`);
  },

  bulkDelete: async () => {
    const ids = [...get().selectedIds];
    set((s) => ({ tasks: s.tasks.filter((t) => !s.selectedIds.has(t.id)), selectedIds: new Set() }));
    await Promise.all(ids.map((id) => api.del(`/api/tasks/${id}`)));
    get().pushToast(`${ids.length} task(s) deleted`);
  },

  bulkMove: async (projectId) => {
    const ids = [...get().selectedIds];
    set({ selectedIds: new Set() });
    await Promise.all(ids.map((id) => api.patch(`/api/tasks/${id}`, { projectId })));
    await get().refreshTasks();
    get().pushToast(`${ids.length} task(s) moved`);
  },

  pushToast: (message, action) => {
    const id = Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { id, message, action }] }));
    setTimeout(() => get().dismissToast(id), 5000);
  },

  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  logout: async () => {
    await api.post('/api/auth/logout', {});
    window.location.href = '/login';
  },
}));
