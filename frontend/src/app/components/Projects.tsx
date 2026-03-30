import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, ListTodo } from 'lucide-react';
import { listProjects, type ApiProject } from '../api/projects';
import { getUser } from '../api/storage';
import { ApiError } from '../api/client';
import { STITCH } from '../stitch/tokens';

function mapStatus(raw: string | null | undefined): string {
  const s = (raw || 'active').toLowerCase();
  if (s === 'on_hold' || s === 'on hold') return 'On hold';
  if (s === 'completed' || s === 'archived') return 'Completed';
  return 'Active';
}

export function ProjectsList() {
  const navigate = useNavigate();
  const user = getUser();
  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const list = await listProjects();
        if (!m) return;
        setProjects(list);
        setLoadError(null);
      } catch (e) {
        if (!m) return;
        setLoadError(e instanceof ApiError ? e.message : 'Failed to load projects');
        setProjects([]);
      } finally {
        if (m) setLoading(false);
      }
    })();
    return () => {
      m = false;
    };
  }, []);

  const sorted = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name)),
    [projects]
  );

  return (
    <div
      className="min-h-full w-full max-w-md mx-auto md:max-w-2xl flex flex-col font-body pb-safe"
      style={{ backgroundColor: STITCH.bg }}
    >
      <header className="sticky top-0 z-10 px-6 py-5 flex items-center justify-between bg-[color:var(--stitch-bg)]/90 backdrop-blur-md border-b" style={{ borderColor: STITCH.borderSubtle }}>
        <h1 className="text-2xl font-semibold text-slate-900 font-display">Projects</h1>
        {canCreate && (
          <button
            type="button"
            disabled
            className="w-10 h-10 rounded-full bg-white border flex items-center justify-center shadow-sm text-[color:var(--stitch-primary)] opacity-50 cursor-not-allowed"
            style={{ borderColor: STITCH.borderSubtle }}
            aria-label="New project (coming soon)"
          >
            <Plus size={22} />
          </button>
        )}
      </header>

      <main className="flex-1 px-4 pb-28 pt-4 space-y-4 overflow-y-auto">
        {loadError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{loadError}</div>
        )}

        {loading && <p className="text-sm px-2" style={{ color: STITCH.textMuted }}>Loading…</p>}

        {!loading &&
          sorted.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/projects/${p.id}`)}
              className="w-full text-left bg-white rounded-lg p-6 border transition-colors active:bg-slate-50"
              style={{ borderColor: STITCH.borderSubtle }}
            >
              <div className="flex justify-between items-start gap-3 mb-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-900 font-display mb-1 truncate">{p.name}</h2>
                  <div className="flex items-center text-sm font-medium gap-1.5" style={{ color: STITCH.textMuted }}>
                    <ListTodo size={16} aria-hidden />
                    <span>{mapStatus(p.status)}</span>
                    {p.managerName ? <span className="text-slate-400">· {p.managerName}</span> : null}
                  </div>
                </div>
              </div>
              {p.description ? (
                <p className="text-sm line-clamp-2 mb-3" style={{ color: STITCH.textMuted }}>
                  {p.description}
                </p>
              ) : null}
            </button>
          ))}

        {!loading && sorted.length === 0 && !loadError && (
          <p className="text-sm text-center py-12" style={{ color: STITCH.textMuted }}>
            No projects yet.
          </p>
        )}
      </main>
    </div>
  );
}
