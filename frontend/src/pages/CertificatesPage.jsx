import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function CertificatesPage() {
  const { user } = useAuth();
  return user.role === 'intern' ? <MyCertificates /> : <IssueCertificates />;
}

function IssueCertificates() {
  const [programs, setPrograms] = useState([]);
  const [programId, setProgramId] = useState('');
  const [rows, setRows] = useState([]);
  const [issuing, setIssuing] = useState(null);

  useEffect(() => {
    api.get('/programs').then((res) => {
      setPrograms(res.data.programs);
      if (res.data.programs.length > 0) setProgramId(String(res.data.programs[0].id));
    });
  }, []);

  const load = useCallback(async () => {
    if (!programId) return;
    const res = await api.get('/certificates/eligibility', { params: { programId } });
    setRows(res.data.interns);
  }, [programId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleIssue(internId) {
    setIssuing(internId);
    try {
      await api.post('/certificates', { internId, programId });
      load();
    } finally {
      setIssuing(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-parchment mb-1">Certification</h1>
          <p className="text-parchment/50 text-sm">Issue completion certificates based on attendance and review scores.</p>
        </div>
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
      </div>

      <div className="border border-ink-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-parchment/45 font-mono text-xs uppercase tracking-wider bg-ink-panel">
              <th className="px-4 py-3">Intern</th>
              <th className="px-4 py-3 text-right">Attendance</th>
              <th className="px-4 py-3 text-right">Avg. score</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="text-parchment/85">
            {rows.map((r) => (
              <tr key={r.intern_id} className="border-t border-ink-line/60">
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3 text-right font-mono">
                  <span className={r.attendance_pct >= 75 ? 'text-stamp-green' : 'text-stamp-amber'}>
                    {r.attendance_pct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono">{r.avg_score}</td>
                <td className="px-4 py-3 text-right">
                  {r.already_issued ? (
                    <span className="text-xs font-mono text-parchment/40">Issued · {r.certificate_code}</span>
                  ) : (
                    <button
                      onClick={() => handleIssue(r.intern_id)}
                      disabled={issuing === r.intern_id}
                      className="bg-stamp-green text-parchment text-xs font-semibold rounded-md px-3 py-1.5 disabled:opacity-50"
                    >
                      {issuing === r.intern_id ? 'Issuing…' : 'Issue certificate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-parchment/40">
                  No interns in this program yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MyCertificates() {
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    api.get('/certificates/mine').then((res) => setCertificates(res.data.certificates));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl text-parchment mb-1">My certificates</h1>
      <p className="text-parchment/50 text-sm mb-8">Completion certificates issued to you.</p>

      <div className="space-y-6">
        {certificates.map((c) => (
          <CertificateCard key={c.id} cert={c} />
        ))}
        {certificates.length === 0 && (
          <p className="text-parchment/40 text-sm py-12 text-center">No certificates issued yet.</p>
        )}
      </div>
    </div>
  );
}

function CertificateCard({ cert }) {
  return (
    <div className="paper-texture bg-parchment rounded-xl p-8 relative overflow-hidden">
      <div className="absolute inset-3 border border-parchment-text/20 rounded-lg pointer-events-none" />
      <p className="text-xs font-mono uppercase tracking-widest text-parchment-text/50 mb-6">
        Certificate of Completion
      </p>
      <h2 className="font-display text-2xl text-parchment-text mb-1">{cert.program_name}</h2>
      <p className="text-parchment-text/60 text-sm mb-6">
        Issued {new Date(cert.issued_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
      <div className="flex items-center gap-8 mb-6">
        <div>
          <p className="text-[11px] font-mono uppercase text-parchment-text/45">Attendance</p>
          <p className="font-display text-xl text-parchment-text">{cert.attendance_pct}%</p>
        </div>
        <div>
          <p className="text-[11px] font-mono uppercase text-parchment-text/45">Avg. score</p>
          <p className="font-display text-xl text-parchment-text">{cert.avg_score ?? '—'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-parchment-text/50">Code: {cert.certificate_code}</p>
        <div className="stamp w-16 h-16 text-[8px] text-stamp-green font-semibold">Verified</div>
      </div>
    </div>
  );
}
