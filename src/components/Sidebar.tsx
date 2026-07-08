'use client';

import { useState } from 'react';
import { useStore, type ActiveView } from '@/lib/store';
import { Icon } from './Icons';
import { useTheme } from '@/lib/theme';
import ProjectDialog from './ProjectDialog';
import ThemeMenu from './ThemeMenu';
import Pomodoro from './Pomodoro';

function NavItem({
  icon,
  label,
  active,
  count,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  count?: number;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
        active ? 'bg-accent/10 font-medium text-accent' : 'text-fg hover:bg-surface-2'
      }`}
    >
      <span className={active ? 'text-accent' : 'text-muted'} style={color ? { color } : undefined}>
        {icon}
      </span>
      <span className="flex-1 truncate text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-muted">{count}</span>
      )}
    </button>
  );
}

export default function Sidebar({
  open,
  onClose,
  onOpenPalette,
}: {
  open: boolean;
  onClose: () => void;
  onOpenPalette: () => void;
}) {
  const { view, setView, projects, labels, filters, user, deleteProject, deleteFilter } = useStore();
  const { toggleDark } = useTheme();
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);

  const inbox = projects.find((p) => p.isInbox);
  const userProjects = projects.filter((p) => !p.isInbox);
  const favorites = [
    ...projects.filter((p) => p.favorite).map((p) => ({ type: 'project' as const, ...p })),
    ...filters.filter((f) => f.favorite).map((f) => ({ type: 'filter' as const, ...f })),
  ];

  const go = (v: ActiveView) => {
    setView(v);
    onClose();
  };
  const isActive = (kind: string, id?: string) =>
    view.kind === kind && (id === undefined || view.id === id);

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-border bg-surface transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* User header */}
        <div className="flex items-center gap-2.5 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg">
            {(user?.name?.[0] ?? 'U').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{user?.name ?? 'You'}</div>
            <div className="truncate text-xs text-muted">
              ⚡ {user?.karma ?? 0} karma
            </div>
          </div>
          <button className="btn-ghost p-1.5" onClick={onOpenPalette} title="Command palette (⌘K)">
            <Icon.Command />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <button
            onClick={onOpenPalette}
            className="mb-3 flex w-full items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm text-muted hover:bg-surface-2"
          >
            <Icon.Search width={16} height={16} />
            Search…
          </button>

          {/* Smart views */}
          <nav className="space-y-0.5">
            <NavItem
              icon={<Icon.Inbox />}
              label="Inbox"
              active={isActive('inbox')}
              count={inbox?.taskCount}
              onClick={() => go({ kind: 'inbox', title: 'Inbox' })}
            />
            <NavItem
              icon={<Icon.Today />}
              label="Today"
              active={isActive('today')}
              onClick={() => go({ kind: 'today', title: 'Today' })}
            />
            <NavItem
              icon={<Icon.Upcoming />}
              label="Upcoming"
              active={isActive('upcoming')}
              onClick={() => go({ kind: 'upcoming', title: 'Upcoming' })}
            />
            <NavItem
              icon={<Icon.Overdue />}
              label="Overdue"
              active={isActive('overdue')}
              onClick={() => go({ kind: 'overdue', title: 'Overdue' })}
            />
            <NavItem
              icon={<Icon.CheckCircle />}
              label="Completed"
              active={isActive('completed')}
              onClick={() => go({ kind: 'completed', title: 'Completed' })}
            />
            <NavItem
              icon={<Icon.Chart />}
              label="Dashboard"
              active={isActive('dashboard')}
              onClick={() => go({ kind: 'dashboard', title: 'Dashboard' })}
            />
          </nav>

          {/* Favorites */}
          {favorites.length > 0 && (
            <Section title="Favorites">
              {favorites.map((f) =>
                f.type === 'project' ? (
                  <NavItem
                    key={`fp-${f.id}`}
                    icon={<span className="text-base leading-none">{f.icon}</span>}
                    label={f.name}
                    color={f.color}
                    active={isActive('project', f.id)}
                    onClick={() => go({ kind: 'project', id: f.id, title: f.name })}
                  />
                ) : (
                  <NavItem
                    key={`ff-${f.id}`}
                    icon={<Icon.Filter />}
                    label={f.name}
                    color={f.color}
                    active={isActive('filter', f.id)}
                    onClick={() => go({ kind: 'filter', id: f.id, title: f.name, query: f.query })}
                  />
                ),
              )}
            </Section>
          )}

          {/* Projects */}
          <Section
            title="Projects"
            action={
              <button
                className="text-muted hover:text-fg"
                onClick={() => setShowProjectDialog(true)}
                title="Add project"
              >
                <Icon.Plus width={16} height={16} />
              </button>
            }
          >
            {userProjects.length === 0 && (
              <p className="px-2.5 py-1 text-xs text-muted">No projects yet</p>
            )}
            {userProjects.map((p) => (
              <div key={p.id} className="group relative flex items-center">
                <NavItem
                  icon={<span className="text-base leading-none">{p.icon}</span>}
                  label={p.name}
                  color={p.color}
                  count={p.taskCount}
                  active={isActive('project', p.id)}
                  onClick={() => go({ kind: 'project', id: p.id, title: p.name })}
                />
                <button
                  className="absolute right-1.5 hidden rounded p-1 text-muted hover:bg-surface hover:text-p1 group-hover:block"
                  onClick={() => {
                    if (confirm(`Delete project "${p.name}" and all its tasks?`)) deleteProject(p.id);
                  }}
                  title="Delete project"
                >
                  <Icon.Trash width={14} height={14} />
                </button>
              </div>
            ))}
          </Section>

          {/* Labels */}
          {labels.length > 0 && (
            <Section title="Labels">
              {labels.map((l) => (
                <NavItem
                  key={l.id}
                  icon={<Icon.Tag />}
                  label={l.name}
                  color={l.color}
                  active={isActive('label', l.id)}
                  onClick={() => go({ kind: 'label', id: l.id, title: l.name })}
                />
              ))}
            </Section>
          )}

          {/* Filters */}
          {filters.length > 0 && (
            <Section title="Filters">
              {filters.map((f) => (
                <div key={f.id} className="group relative flex items-center">
                  <NavItem
                    icon={<Icon.Filter />}
                    label={f.name}
                    color={f.color}
                    active={isActive('filter', f.id)}
                    onClick={() => go({ kind: 'filter', id: f.id, title: f.name, query: f.query })}
                  />
                  <button
                    className="absolute right-1.5 hidden rounded p-1 text-muted hover:bg-surface hover:text-p1 group-hover:block"
                    onClick={() => deleteFilter(f.id)}
                    title="Delete filter"
                  >
                    <Icon.Trash width={14} height={14} />
                  </button>
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-1 border-t border-border px-3 py-2">
          <button className="btn-ghost flex-1 justify-start gap-2 text-sm" onClick={() => setShowPomodoro(true)}>
            <Icon.Timer /> Focus
          </button>
          <button className="btn-ghost p-2" onClick={() => setShowThemeMenu(true)} title="Theme">
            <Icon.Sun />
          </button>
          <button className="btn-ghost p-2" onClick={toggleDark} title="Toggle dark mode">
            <Icon.Moon />
          </button>
          <button className="btn-ghost p-2" onClick={() => useStore.getState().logout()} title="Log out">
            <Icon.Logout />
          </button>
        </div>
      </aside>

      {showProjectDialog && <ProjectDialog onClose={() => setShowProjectDialog(false)} />}
      {showThemeMenu && <ThemeMenu onClose={() => setShowThemeMenu(false)} />}
      {showPomodoro && <Pomodoro onClose={() => setShowPomodoro(false)} />}
    </>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="mb-1 flex items-center justify-between px-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</span>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
