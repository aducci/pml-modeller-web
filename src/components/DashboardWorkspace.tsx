'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type ProjectListItem = {
  id: string;
  name: string;
  updatedAt: string;
};

export function DashboardWorkspace() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState<'blank' | 'onboarding' | 'incident'>('blank');
  const [isCreating, setIsCreating] = useState(false);

  const templateHint = useMemo(() => {
    if (template === 'onboarding') return 'Customer onboarding starter structure';
    if (template === 'incident') return 'Incident response starter structure';
    return 'Blank process with start, task, and end';
  }, [template]);

  useEffect(() => {
    let cancelled = false;

    const loadProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/projects', { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) {
          setError(data?.error || 'Unable to load projects.');
          return;
        }
        if (!cancelled) {
          setProjects(data.projects || []);
        }
      } catch {
        if (!cancelled) {
          setError('Unable to load projects.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async () => {
    setIsCreating(true);
    setError(null);
    try {
      const finalName = name.trim() || defaultNameFromTemplate(template);
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName, template }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Unable to create project.');
        return;
      }

      const created = data?.project as ProjectListItem;
      if (!created?.id) {
        setError('Project created but response was incomplete.');
        return;
      }

      setIsModalOpen(false);
      router.push(`/dashboard/${created.id}`);
    } catch {
      setError('Unable to create project.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your process workspace</h2>
            <p className="mt-2 text-gray-600">Create and open projects from one place.</p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90"
          >
            New project
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl border border-dashed border-gray-300 p-6 text-left hover:border-teal transition-colors"
          >
            <p className="text-sm font-semibold text-gray-900">+ New project</p>
            <p className="mt-2 text-xs text-gray-500">Choose a name and start modeling right away.</p>
          </button>

          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">Loading projects...</div>
          ) : null}

          {!loading && projects.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-500">No projects yet. Create your first one.</div>
          ) : null}

          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/${project.id}`}
              className="rounded-xl border border-gray-200 bg-white p-6 hover:border-teal hover:shadow-sm transition-all"
            >
              <p className="text-sm font-semibold text-gray-900">{project.name}</p>
              <p className="mt-2 text-xs text-gray-500">Updated {new Date(project.updatedAt).toLocaleString()}</p>
            </Link>
          ))}
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/35 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl page-enter">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Create new project</h3>
                <p className="mt-1 text-sm text-gray-600">Set a project name and start inside the editor immediately.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Project name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={defaultNameFromTemplate(template)}
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-teal focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Starter template</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {[
                    { key: 'blank', label: 'Blank' },
                    { key: 'onboarding', label: 'Onboarding' },
                    { key: 'incident', label: 'Incident' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setTemplate(opt.key as 'blank' | 'onboarding' | 'incident')}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        template === opt.key
                          ? 'border-teal/30 bg-teal/10 text-teal'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">{templateHint}</p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-60"
              >
                {isCreating ? 'Creating...' : 'Create and open'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function defaultNameFromTemplate(template: 'blank' | 'onboarding' | 'incident') {
  if (template === 'onboarding') return 'Customer onboarding process';
  if (template === 'incident') return 'Incident response process';
  return 'Untitled process';
}
