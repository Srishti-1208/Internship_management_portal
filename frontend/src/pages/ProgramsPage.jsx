import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const STATUS_STYLES = {
  draft: 'text-stamp-slate border-stamp-slate/40 bg-stamp-slate/10',
  active: 'text-stamp-green border-stamp-green/40 bg-stamp-green/10',
  completed: 'text-parchment border-parchment/30 bg-parchment/10',
  archived: 'text-stamp-red border-stamp-red/40 bg-stamp-red/10',
};

export default function ProgramsPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.get('/programs');
    setPrograms(res.data.programs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-parchment mb-1">Programs</h1>
          <p className="text-parchment/50 text-sm">Cohorts and batches running in your internship program.</p>
        </div>
        {user.role === 'admin' && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-parchment text-parchment-text font-semibold rounded-md px-4 py-2 text-sm hover:bg-parchment-dim transition"
          >
            {showForm ? 'Cancel' : '+ New program'}
          </button>
        )}
      </div>

      {showForm && <NewProgramForm onCreated={() => { setShowForm(false); load(); }} />}

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        {programs.map((p) => (
          <Link
            key={p.id}
            to={`/programs/${p.id}`}
            className="bg-ink-panel border border-ink-line rounded-lg p-5 hover:border-stamp-amber/40 transition block"
          >
            <div className="flex items-start justify-between mb-2">
              <h2 className="font-display text-lg text-parchment">{p.name}</h2>
              <span className={`text-[11px] font-mono uppercase px-2 py-0.5 rounded-full border ${STATUS_STYLES[p.status]}`}>
                {p.status}
              </span>
            </div>
            {p.description && <p className="text-parchment/55 text-sm mb-3 line-clamp-2">{p.description}</p>}
            <div className="flex items-center gap-4 text-xs font-mono text-parchment/45">
              <span>{p.intern_count} intern{p.intern_count === '1' ? '' : 's'}</span>
              {p.department && <span>· {p.department}</span>}
              {p.start_date && <span>· starts {p.start_date.slice(0, 10)}</span>}
            </div>
          </Link>
        ))}
        {!loading && programs.length === 0 && (
          <p className="text-parchment/40 text-sm col-span-2 py-8 text-center">
            No programs yet{user.role === 'admin' ? ' — create one to get started.' : '.'}
          </p>
        )}
      </div>
    </div>
  );
}

function NewProgramForm({ onCreated }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    department: '',
    startDate: '',
    endDate: '',
    status: 'draft',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/programs', form);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create program.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-ink-panel border border-ink-line rounded-lg p-6 space-y-4 mb-2">
      {error && (
        <p className="text-sm text-stamp-red bg-stamp-red/10 border border-stamp-red/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
            Program name
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
            placeholder="Summer 2026 Cohort"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
            Department
          </label>
          <input
            value={form.department}
            onChange={(e) => update('department', e.target.value)}
            className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
            placeholder="Engineering"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          rows={2}
          className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
            Start date
          </label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => update('startDate', e.target.value)}
            className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
            End date
          </label>
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => update('endDate', e.target.value)}
            className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
            className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="bg-stamp-green text-parchment font-semibold rounded-md px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create program'}
      </button>
    </form>
  );
}
