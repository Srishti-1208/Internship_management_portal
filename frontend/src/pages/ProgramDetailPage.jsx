import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ProgramDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [program, setProgram] = useState(null);
  const [interns, setInterns] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState('');
  const [selectedMentor, setSelectedMentor] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const res = await api.get(`/programs/${id}`);
    setProgram(res.data.program);
    setInterns(res.data.interns);

    if (user.role === 'admin') {
      const [unassigned, mentorList] = await Promise.all([
        api.get('/programs/unassigned-interns', { params: { programId: id } }),
        api.get('/programs/mentors/list'),
      ]);
      setCandidates(unassigned.data.interns);
      setMentors(mentorList.data.mentors);
    }
  }, [id, user.role]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAssign(e) {
    e.preventDefault();
    setError('');
    if (!selectedIntern) return;
    try {
      await api.post(`/programs/${id}/interns`, {
        userId: selectedIntern,
        mentorId: selectedMentor || undefined,
      });
      setSelectedIntern('');
      setSelectedMentor('');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not assign intern.');
    }
  }

  async function handleRemove(userId) {
    await api.delete(`/programs/${id}/interns/${userId}`);
    load();
  }

  if (!program) {
    return <div className="px-6 py-10 text-parchment/50 font-mono text-sm">Loading program…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link to="/programs" className="text-parchment/45 text-sm hover:text-parchment mb-4 inline-block">
        ← All programs
      </Link>

      <h1 className="font-display text-3xl text-parchment mb-1">{program.name}</h1>
      <div className="flex items-center gap-3 text-sm text-parchment/50 mb-6 font-mono">
        <span className="uppercase">{program.status}</span>
        {program.department && <span>· {program.department}</span>}
        {program.start_date && (
          <span>
            · {program.start_date.slice(0, 10)} → {program.end_date ? program.end_date.slice(0, 10) : 'ongoing'}
          </span>
        )}
      </div>
      {program.description && <p className="text-parchment/70 mb-8">{program.description}</p>}

      {user.role === 'admin' && (
        <div className="bg-ink-panel border border-ink-line rounded-lg p-5 mb-8">
          <p className="text-xs font-mono uppercase tracking-wider text-parchment/45 mb-4">Assign an intern</p>
          {error && (
            <p className="text-sm text-stamp-red bg-stamp-red/10 border border-stamp-red/30 rounded-md px-3 py-2 mb-3">
              {error}
            </p>
          )}
          <form onSubmit={handleAssign} className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-parchment/45 mb-1.5">Intern</label>
              <select
                value={selectedIntern}
                onChange={(e) => setSelectedIntern(e.target.value)}
                className="w-full bg-ink border border-ink-line rounded-md px-3 py-2 text-sm text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
              >
                <option value="">Select intern…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-parchment/45 mb-1.5">Mentor (optional)</label>
              <select
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
                className="w-full bg-ink border border-ink-line rounded-md px-3 py-2 text-sm text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
              >
                <option value="">No mentor</option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.department ? `— ${m.department}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!selectedIntern}
              className="bg-stamp-green text-parchment font-semibold rounded-md px-4 py-2 text-sm disabled:opacity-40"
            >
              Assign
            </button>
          </form>
          {candidates.length === 0 && (
            <p className="text-parchment/35 text-xs mt-3">All interns are already assigned to this program.</p>
          )}
        </div>
      )}

      <h2 className="font-display text-xl text-parchment mb-4">
        Interns <span className="text-parchment/40 text-base font-body">({interns.length})</span>
      </h2>
      <div className="border border-ink-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-parchment/45 font-mono text-xs uppercase tracking-wider bg-ink-panel">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Mentor</th>
              <th className="px-4 py-3">Joined</th>
              {user.role === 'admin' && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="text-parchment/85">
            {interns.map((i) => (
              <tr key={i.id} className="border-t border-ink-line/60">
                <td className="px-4 py-3">{i.name}</td>
                <td className="px-4 py-3 text-parchment/60">{i.department || '—'}</td>
                <td className="px-4 py-3 text-parchment/60">{i.mentor_name || 'Unassigned'}</td>
                <td className="px-4 py-3 font-mono text-parchment/60">{i.joined_at.slice(0, 10)}</td>
                {user.role === 'admin' && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(i.id)}
                      className="text-stamp-red/70 hover:text-stamp-red text-xs"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {interns.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-parchment/40">
                  No interns assigned to this program yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
