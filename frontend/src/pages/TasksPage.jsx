import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function TasksPage() {
  const { user } = useAuth();
  return user.role === 'intern' ? <MyTasksView /> : <TaskRosterView />;
}

function TaskRosterView() {
  const [programs, setPrograms] = useState([]);
  const [programId, setProgramId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    api.get('/programs').then((res) => {
      setPrograms(res.data.programs);
      if (res.data.programs.length > 0) setProgramId(String(res.data.programs[0].id));
    });
  }, []);

  const load = useCallback(async () => {
    const res = await api.get('/tasks', { params: programId ? { programId } : {} });
    setTasks(res.data.tasks);
  }, [programId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-parchment mb-1">Tasks</h1>
          <p className="text-parchment/50 text-sm">Assign work and track submissions.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="bg-ink-panel border border-ink-line rounded-md px-3 py-2 text-sm text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
          >
            <option value="">All programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowForm((s) => !s)}
            disabled={!programId}
            className="bg-parchment text-parchment-text font-semibold rounded-md px-4 py-2 text-sm hover:bg-parchment-dim transition disabled:opacity-40"
          >
            {showForm ? 'Cancel' : '+ New task'}
          </button>
        </div>
      </div>

      {showForm && programId && (
        <NewTaskForm programId={programId} onCreated={() => { setShowForm(false); load(); }} />
      )}

      <div className="border border-ink-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-parchment/45 font-mono text-xs uppercase tracking-wider bg-ink-panel">
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Assigned</th>
              <th className="px-4 py-3">Submitted</th>
            </tr>
          </thead>
          <tbody className="text-parchment/85">
            {tasks.map((t) => (
              <tr key={t.id} className="border-t border-ink-line/60">
                <td className="px-4 py-3">
                  <Link to={`/tasks/${t.id}`} className="hover:text-stamp-amber transition">
                    {t.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-parchment/60">{t.program_name}</td>
                <td className="px-4 py-3 font-mono text-parchment/60">
                  {t.due_date ? t.due_date.slice(0, 10) : '—'}
                </td>
                <td className="px-4 py-3 font-mono">{t.assignment_count}</td>
                <td className="px-4 py-3 font-mono">{t.submission_count}</td>
              </tr>
            ))}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-parchment/40">
                  No tasks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function NewTaskForm({ programId, onCreated }) {
  const [interns, setInterns] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', internIds: [] });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/programs/${programId}`).then((res) => setInterns(res.data.interns));
  }, [programId]);

  function toggleIntern(id) {
    setForm((f) => ({
      ...f,
      internIds: f.internIds.includes(id) ? f.internIds.filter((x) => x !== id) : [...f.internIds, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/tasks', { ...form, programId });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create task.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-ink-panel border border-ink-line rounded-lg p-6 space-y-4 mb-8">
      {error && (
        <p className="text-sm text-stamp-red bg-stamp-red/10 border border-stamp-red/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">Title</label>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
            Due date
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
          className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
        />
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
          Assign to
        </label>
        <div className="flex flex-wrap gap-2">
          {interns.map((i) => (
            <button
              type="button"
              key={i.id}
              onClick={() => toggleIntern(i.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                form.internIds.includes(i.id)
                  ? 'bg-stamp-green/15 border-stamp-green/50 text-stamp-green'
                  : 'border-ink-line text-parchment/60 hover:border-parchment/30'
              }`}
            >
              {i.name}
            </button>
          ))}
          {interns.length === 0 && <p className="text-parchment/35 text-xs">No interns in this program yet.</p>}
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-stamp-green text-parchment font-semibold rounded-md px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create task'}
      </button>
    </form>
  );
}

function MyTasksView() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await api.get('/tasks/mine');
    setTasks(res.data.tasks);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(assignmentId, contentUrl, notes) {
    setError('');
    try {
      await api.post(`/tasks/assignments/${assignmentId}/submit`, { contentUrl, notes });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit work.');
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl text-parchment mb-1">My tasks</h1>
      <p className="text-parchment/50 text-sm mb-8">Work assigned to you across your programs.</p>

      {error && (
        <p className="text-sm text-stamp-red bg-stamp-red/10 border border-stamp-red/30 rounded-md px-3 py-2 mb-6">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {tasks.map((t) => (
          <TaskCard key={t.assignment_id} task={t} onSubmit={handleSubmit} />
        ))}
        {tasks.length === 0 && (
          <p className="text-parchment/40 text-sm py-12 text-center">No tasks assigned to you yet.</p>
        )}
      </div>
    </div>
  );
}

const STATUS_STYLES = {
  not_started: 'text-stamp-slate border-stamp-slate/40 bg-stamp-slate/10',
  in_progress: 'text-stamp-amber border-stamp-amber/40 bg-stamp-amber/10',
  submitted: 'text-parchment border-parchment/30 bg-parchment/10',
  needs_revision: 'text-stamp-red border-stamp-red/40 bg-stamp-red/10',
  approved: 'text-stamp-green border-stamp-green/40 bg-stamp-green/10',
};
const STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
  needs_revision: 'Needs revision',
  approved: 'Approved',
};

function TaskCard({ task, onSubmit }) {
  const [contentUrl, setContentUrl] = useState(task.content_url || '');
  const [notes, setNotes] = useState(task.submission_notes || '');
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-ink-panel border border-ink-line rounded-lg p-5">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <p className="font-display text-lg text-parchment">{task.title}</p>
          <p className="text-xs text-parchment/45 font-mono">
            {task.program_name} {task.due_date ? `· due ${task.due_date.slice(0, 10)}` : ''}
          </p>
        </div>
        <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded-full border shrink-0 ${STATUS_STYLES[task.status]}`}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      {task.description && <p className="text-parchment/65 text-sm mb-3">{task.description}</p>}

      {task.score !== null && task.score !== undefined && (
        <div className="bg-ink border border-ink-line rounded-md p-3 mb-3">
          <p className="text-xs font-mono text-parchment/45 mb-1">Score: {task.score}/100</p>
          {task.feedback && <p className="text-sm text-parchment/80">{task.feedback}</p>}
        </div>
      )}

      {!editing && task.submission_id ? (
        <div className="text-sm text-parchment/70 flex items-center justify-between">
          <span className="font-mono truncate">{task.content_url}</span>
          <button onClick={() => setEditing(true)} className="text-stamp-amber text-xs ml-3 shrink-0">
            Resubmit
          </button>
        </div>
      ) : (
        (editing || !task.submission_id) && (
          <div className="space-y-2 mt-3">
            <input
              value={contentUrl}
              onChange={(e) => setContentUrl(e.target.value)}
              placeholder="Link to your work (GitHub, doc, etc.)"
              className="w-full bg-ink border border-ink-line rounded-md px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes for your mentor (optional)"
              rows={2}
              className="w-full bg-ink border border-ink-line rounded-md px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
            />
            <button
              onClick={() => {
                onSubmit(task.assignment_id, contentUrl, notes);
                setEditing(false);
              }}
              disabled={!contentUrl}
              className="bg-stamp-green text-parchment font-semibold rounded-md px-4 py-2 text-sm disabled:opacity-40"
            >
              Submit
            </button>
          </div>
        )
      )}
    </div>
  );
}
