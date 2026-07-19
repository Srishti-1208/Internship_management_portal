import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function CertificatesPage() {
  const { user } = useAuth();
  if (user.role === 'intern') return <MyCertificates />;
  if (user.role === 'mentor') return <IssueCertificates />;
  return <AdminOversight />;
}

function IssueCertificates() {
  const [programs, setPrograms] = useState([]);
  const [programId, setProgramId] = useState('');
  const [rows, setRows] = useState([]);
  const [issuing, setIssuing] = useState(null);
  const [loaded, setLoaded] = useState(false);

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
    setLoaded(true);
  }, [programId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleIssue(internId) {
    setIssuing(internId);
    try {
      await api.post('/certificates', { internId, programId });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not issue certificate.');
    } finally {
      setIssuing(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl text-parchment mb-1">Certification</h1>
          <p className="text-parchment/50 text-sm">
            Issue completion certificates for your own interns, based on attendance and review scores.
          </p>
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
            {loaded && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-parchment/40">
                  You have no interns in this program yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminOversight() {
  const [certificates, setCertificates] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get('/certificates/all').then((res) => {
      setCertificates(res.data.certificates);
      setLoaded(true);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl text-parchment mb-1">Certificates issued</h1>
      <p className="text-parchment/50 text-sm mb-8">
        Mentors issue certificates for their own interns. This is a read-only record for oversight.
      </p>

      <div className="border border-ink-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-parchment/45 font-mono text-xs uppercase tracking-wider bg-ink-panel">
              <th className="px-4 py-3">Intern</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Issued by</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="text-parchment/85">
            {certificates.map((c) => (
              <tr key={c.id} className="border-t border-ink-line/60">
                <td className="px-4 py-3">{c.intern_name}</td>
                <td className="px-4 py-3 text-parchment/60">{c.program_name}</td>
                <td className="px-4 py-3 text-parchment/60">{c.issued_by_name}</td>
                <td className="px-4 py-3 font-mono text-parchment/60">{c.certificate_code}</td>
                <td className="px-4 py-3 font-mono text-parchment/60">
                  {new Date(c.issued_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {loaded && certificates.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-parchment/40">
                  No certificates have been issued yet.
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
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    api.get('/certificates/mine').then((res) => setCertificates(res.data.certificates));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl text-parchment mb-1">My certificates</h1>
      <p className="text-parchment/50 text-sm mb-8">Completion certificates issued to you by your mentor.</p>

      <div className="space-y-8">
        {certificates.map((c) => (
          <CertificateCard key={c.id} cert={{ ...c, intern_name: user.name }} />
        ))}
        {certificates.length === 0 && (
          <p className="text-parchment/40 text-sm py-12 text-center">No certificates issued yet.</p>
        )}
      </div>
    </div>
  );
}

function CertificateCard({ cert }) {
  function handlePrint() {
    const node = document.getElementById(`cert-${cert.id}`);
    const w = window.open('', '_blank');
    w.document.write(`
      <html>
        <head>
          <title>Certificate — ${cert.program_name}</title>
          <style>
            body { margin: 0; font-family: Georgia, 'Times New Roman', serif; background: #f6f1e4; }
            .wrap { padding: 40px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="wrap">${node.outerHTML}</div>
        </body>
      </html>
    `);
    w.document.close();
  }

  return (
    <div>
      <div
        id={`cert-${cert.id}`}
        className="relative overflow-hidden rounded-md"
        style={{
          background: 'linear-gradient(180deg, #f8f3e7 0%, #f1e9d6 100%)',
          padding: '48px 56px',
          border: '10px solid #16352b',
          boxShadow: '0 6px 24px rgba(0,0,0,0.25)',
        }}
      >
        <div
          className="absolute inset-[14px] pointer-events-none rounded-sm"
          style={{ border: '1.5px solid #b98a3d' }}
        />
        <div
          className="absolute inset-[20px] pointer-events-none rounded-sm"
          style={{ border: '1px solid #b98a3d55' }}
        />

        <div className="relative text-center">
          <p
            className="text-[11px] tracking-[0.35em] uppercase mb-1"
            style={{ color: '#8a6a2f', fontFamily: 'Georgia, serif' }}
          >
            Certificate of Completion
          </p>
          <h2
            className="text-3xl mb-5"
            style={{ color: '#16352b', fontFamily: 'Georgia, serif', fontWeight: 700 }}
          >
            {cert.program_name}
          </h2>

          <p className="text-sm mb-1" style={{ color: '#3a3120' }}>
            This is to certify that
          </p>
          <p
            className="text-2xl mb-4"
            style={{ color: '#16352b', fontFamily: 'Georgia, serif', fontWeight: 600 }}
          >
            {cert.intern_name || 'the intern named above'}
          </p>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: '#3a3120' }}>
            has successfully completed the internship program with an attendance record of{' '}
            <strong>{cert.attendance_pct}%</strong> and an average evaluation score of{' '}
            <strong>{cert.avg_score ?? '—'}</strong>.
          </p>

          <div className="flex items-center justify-between mt-10">
            <div className="text-left">
              <div style={{ borderTop: '1px solid #8a6a2f', width: '160px', marginBottom: '4px' }} />
              <p className="text-[11px]" style={{ color: '#5a4a2a' }}>Mentor's signature</p>
            </div>

            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-[9px] font-semibold text-center leading-tight"
              style={{
                border: '3px double #a8321f',
                color: '#a8321f',
                transform: 'rotate(-8deg)',
              }}
            >
              VERIFIED
            </div>

            <div className="text-right">
              <p className="text-[11px] font-mono" style={{ color: '#5a4a2a' }}>
                {new Date(cert.issued_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-[11px]" style={{ color: '#5a4a2a' }}>Date issued</p>
            </div>
          </div>

          <p className="text-[10px] font-mono mt-6" style={{ color: '#8a7a55' }}>
            Certificate code: {cert.certificate_code}
          </p>
        </div>
      </div>
      <div className="text-right mt-2">
        <button
          onClick={handlePrint}
          className="text-xs font-mono text-parchment/50 hover:text-parchment underline"
        >
          Print / Download
        </button>
      </div>
    </div>
  );
}
