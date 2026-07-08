'use client';

import { useStore } from '@/lib/store';
import { Icon } from './Icons';

export default function BulkBar() {
  const selectedIds = useStore((s) => s.selectedIds);
  const clearSelection = useStore((s) => s.clearSelection);
  const bulkComplete = useStore((s) => s.bulkComplete);
  const bulkDelete = useStore((s) => s.bulkDelete);
  const bulkMove = useStore((s) => s.bulkMove);
  const projects = useStore((s) => s.projects);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 shadow-lg">
        <span className="px-1 text-sm font-medium">{selectedIds.size} selected</span>
        <div className="h-5 w-px bg-border" />
        <button className="btn-ghost gap-1.5 px-2 py-1 text-sm" onClick={bulkComplete}>
          <Icon.Check width={16} height={16} /> Complete
        </button>
        <select
          className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) bulkMove(e.target.value);
            e.target.value = '';
          }}
        >
          <option value="" disabled>
            Move to…
          </option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.name}
            </option>
          ))}
        </select>
        <button className="btn-ghost gap-1.5 px-2 py-1 text-sm text-p1" onClick={bulkDelete}>
          <Icon.Trash width={16} height={16} /> Delete
        </button>
        <button className="btn-ghost p-1.5" onClick={clearSelection} title="Clear selection">
          <Icon.Close width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
