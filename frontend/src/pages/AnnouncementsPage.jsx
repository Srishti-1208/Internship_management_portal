import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', programId: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canPost = user.role === 'admin' || user.role === 'mentor';

  useEffect(() => {
    if (canPost) {
      api.get('/programs').then((res) => setPrograms(res.data.programs));
    }
  }, [canPost]);

  const load = useCallback(async () => {
    const res = await api.get('/announcements');
    setAnnouncements(res.data.announcements);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/announcements', { ...form, programId: form.programId || null });
      setForm({ title: '', body: '', programId: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not post announcement.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    await api.delete(`/announcements/${id}`);
    load();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-parchment mb-1">Announcements</h1>
          <p className="text-parchment/50 text-sm">Program-wide and general updates.</p>
        </div>
        {canPost && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-parchment text-parchment-text font-semibold rounded-md px-4 py-2 text-sm hover:bg-parchment-dim transition"
          >
            {showForm ? 'Cancel' : '+ New announcement'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-ink-panel border border-ink-line rounded-lg p-6 space-y-4 mb-8">
          {error && (
            <p className="text-sm text-stamp-red bg-stamp-red/10 border border-stamp-red/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
                Title
              </label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
                Scope
              </label>
              <select
                value={form.programId}
                onChange={(e) => setForm((f) => ({ ...f, programId: e.target.value }))}
                className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
              >
                <option value="">Global (everyone)</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} only
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
              Message
            </label>
            <textarea
              required
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={4}
              className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-stamp-green text-parchment font-semibold rounded-md px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {submitting ? 'Posting…' : 'Post announcement'}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="bg-ink-panel border border-ink-line rounded-lg p-5">
            <div className="flex items-start justify-between gap-4 mb-2">
              <h2 className="font-display text-lg text-parchment">{a.title}</h2>
              {canPost && (a.author_id === user.id || user.role === 'admin') && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-stamp-red/60 hover:text-stamp-red text-xs shrink-0"
                >
                  Delete
                </button>
              )}
            </div>
            <p className="text-parchment/70 text-sm mb-3 whitespace-pre-wrap">{a.body}</p>
            <p className="text-xs font-mono text-parchment/40">
              {a.author_name || 'Unknown'} · {a.program_name || 'Global'} ·{' '}
              {new Date(a.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
        {announcements.length === 0 && (
          <p className="text-parchment/40 text-sm py-12 text-center">No announcements yet.</p>
        )}
      </div>
    </div>
  );
}
