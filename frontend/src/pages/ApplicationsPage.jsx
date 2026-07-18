import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'offered', label: 'Offered' },
  { key: 'rejected', label: 'Rejected' },
];

const NEXT_STAGE = { applied: 'shortlisted', shortlisted: 'offered' };

export default function ApplicationsPage() {
  const [programs, setPrograms] = useState([]);
  const [programId, setProgramId] = useState('');
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [onboardResult, setOnboardResult] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/programs').then((res) => {
      setPrograms(res.data.programs);
      if (res.data.programs.length > 0) setProgramId(String(res.data.programs[0].id));
    });
    api.get('/programs/mentors/list').then((res) => setMentors(res.data.mentors));
  }, []);

  const loadApplications = useCallback(async () => {
    if (!programId) return;
    const res = await api.get('/applications', { params: { programId } });
    setApplications(res.data.applications);
  }, [programId]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  async function moveStage(app, status) {
    setError('');
    try {
      await api.put(`/applications/${app.id}`, { status });
      loadApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update this application.');
    }
  }

  async function handleOnboard(app, mentorId) {
    setError('');
    try {
      const res = await api.post(`/applications/${app.id}/onboard`, { mentorId: mentorId || undefined });
      setOnboardResult({ name: app.name, email: app.email, ...res.data });
      loadApplications();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not onboard this applicant.');
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-parchment mb-1">Applications</h1>
          <p className="text-parchment/50 text-sm">Move candidates through the selection pipeline.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            className="bg-ink-panel border border-ink-line rounded-md px-3 py-2 text-sm text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
          >
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
            {showForm ? 'Cancel' : '+ Add applicant'}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-stamp-red bg-stamp-red/10 border border-stamp-red/30 rounded-md px-3 py-2 mb-6">
          {error}
        </p>
      )}

      {onboardResult && (
        <div className="bg-stamp-green/10 border border-stamp-green/30 rounded-lg p-4 mb-6 flex items-start justify-between gap-4">
          <div className="text-sm text-parchment/85">
            <p className="font-semibold text-stamp-green mb-1">{onboardResult.name} onboarded</p>
            <p>{onboardResult.message}</p>
            {onboardResult.tempPassword && (
              <p className="font-mono mt-2 bg-ink px-3 py-1.5 rounded inline-block">
                {onboardResult.email} / {onboardResult.tempPassword}
              </p>
            )}
          </div>
          <button onClick={() => setOnboardResult(null)} className="text-parchment/40 hover:text-parchment text-sm">
            ✕
          </button>
        </div>
      )}

      {showForm && programId && (
        <NewApplicationForm programId={programId} onCreated={() => { setShowForm(false); loadApplications(); }} />
      )}

      {!programId ? (
        <p className="text-parchment/40 text-sm py-12 text-center">Create a program first to start tracking applicants.</p>
      ) : (
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          {STAGES.map((stage) => (
            <div key={stage.key} className="bg-ink-panel border border-ink-line rounded-lg p-4">
              <p className="text-xs font-mono uppercase tracking-wider text-parchment/45 mb-3">
                {stage.label} · {applications.filter((a) => a.status === stage.key).length}
              </p>
              <div className="space-y-3">
                {applications
                  .filter((a) => a.status === stage.key)
                  .map((app) => (
                    <ApplicantCard
                      key={app.id}
                      app={app}
                      mentors={mentors}
                      onAdvance={() => NEXT_STAGE[stage.key] && moveStage(app, NEXT_STAGE[stage.key])}
                      onReject={() => moveStage(app, 'rejected')}
                      onOnboard={(mentorId) => handleOnboard(app, mentorId)}
                      nextLabel={NEXT_STAGE[stage.key] ? STAGES.find((s) => s.key === NEXT_STAGE[stage.key]).label : null}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ApplicantCard({ app, mentors, onAdvance, onReject, onOnboard, nextLabel }) {
  const [mentorId, setMentorId] = useState('');

  return (
    <div className="bg-ink border border-ink-line rounded-md p-3">
      <p className="text-sm text-parchment font-medium">{app.name}</p>
      <p className="text-xs text-parchment/45 font-mono mb-2">{app.email}</p>
      {app.notes && <p className="text-xs text-parchment/55 mb-2">{app.notes}</p>}

      {app.status === 'offered' ? (
        <div className="space-y-2 mt-2">
          <select
            value={mentorId}
            onChange={(e) => setMentorId(e.target.value)}
            className="w-full bg-ink-panel border border-ink-line rounded px-2 py-1 text-xs text-parchment"
          >
            <option value="">No mentor yet</option>
            {mentors.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              onClick={() => onOnboard(mentorId)}
              className="flex-1 bg-stamp-green text-parchment text-xs font-semibold rounded px-2 py-1.5"
            >
              Onboard
            </button>
            <button onClick={onReject} className="text-stamp-red/70 hover:text-stamp-red text-xs px-2">
              Reject
            </button>
          </div>
        </div>
      ) : app.status === 'rejected' ? null : (
        <div className="flex gap-2 mt-2">
          {nextLabel && (
            <button
              onClick={onAdvance}
              className="flex-1 bg-ink-panel border border-ink-line hover:border-stamp-amber/50 text-parchment text-xs rounded px-2 py-1.5 transition"
            >
              Move to {nextLabel}
            </button>
          )}
          <button onClick={onReject} className="text-stamp-red/70 hover:text-stamp-red text-xs px-2">
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

function NewApplicationForm({ programId, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', department: '', notes: '' });
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
      await api.post('/applications', { ...form, programId });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add applicant.');
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
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
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
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => update('notes', e.target.value)}
          rows={2}
          className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="bg-stamp-green text-parchment font-semibold rounded-md px-5 py-2.5 text-sm disabled:opacity-50"
      >
        {submitting ? 'Adding…' : 'Add applicant'}
      </button>
    </form>
  );
}