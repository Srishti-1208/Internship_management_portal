import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api/axios';
import StatCard from '../components/StatCard';

export default function AnalyticsDashboard() {
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [interns, setInterns] = useState([]);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/trend', { params: { days: 21 } }),
      api.get('/analytics/interns'),
      api.get('/analytics/department-breakdown'),
    ]).then(([o, t, i, d]) => {
      setOverview(o.data);
      setTrend(
        t.data.trend.map((row) => ({
          date: row.date.slice(5, 10),
          present: parseInt(row.present, 10),
          absent: parseInt(row.absent, 10),
        }))
      );
      setInterns(i.data.interns);
      setDepartments(d.data.departments);
    });
  }, []);

  if (!overview) {
    return <div className="px-6 py-10 text-parchment/50 font-mono text-sm">Loading analytics…</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl text-parchment mb-1">Program analytics</h1>
      <p className="text-parchment/50 text-sm mb-8">A read on how the cohort is showing up.</p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <StatCard label="Total interns" value={overview.totalInterns} />
        <StatCard label="Present today" value={overview.today.present} accent="text-stamp-green" />
        <StatCard label="Absent today" value={overview.today.absent} accent="text-stamp-red" />
        <StatCard label="Half day today" value={overview.today.halfDay} accent="text-stamp-amber" />
        <StatCard label="Avg. attendance" value={overview.avgAttendancePct} suffix="%" accent="text-parchment" />
      </div>

      <div className="bg-ink-panel border border-ink-line rounded-lg p-6 mb-10">
        <p className="text-xs font-mono uppercase tracking-wider text-parchment/45 mb-4">
          Attendance trend — last 21 days
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trend}>
            <defs>
              <linearGradient id="presentFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4C7A63" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#4C7A63" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="absentFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#B14B3D" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#B14B3D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#2A353B" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" stroke="#8A8577" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#8A8577" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#1A2226', border: '1px solid #2A353B', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#EDE6D6' }}
            />
            <Area type="monotone" dataKey="present" stroke="#4C7A63" fill="url(#presentFill)" strokeWidth={2} />
            <Area type="monotone" dataKey="absent" stroke="#B14B3D" fill="url(#absentFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-xl text-parchment mb-4">Intern standing</h2>
          <div className="border border-ink-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-parchment/45 font-mono text-xs uppercase tracking-wider bg-ink-panel">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Dept.</th>
                  <th className="px-4 py-3 text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="text-parchment/85">
                {interns.map((row) => (
                  <tr key={row.user_id} className="border-t border-ink-line/60">
                    <td className="px-4 py-3">{row.name}</td>
                    <td className="px-4 py-3 text-parchment/60">{row.department || '—'}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.attendance_pct !== null ? `${row.attendance_pct}%` : '—'}
                    </td>
                  </tr>
                ))}
                {interns.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-parchment/40">
                      No intern data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl text-parchment mb-4">By department</h2>
          <div className="border border-ink-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-parchment/45 font-mono text-xs uppercase tracking-wider bg-ink-panel">
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3 text-right">Interns</th>
                  <th className="px-4 py-3 text-right">Avg. attendance</th>
                </tr>
              </thead>
              <tbody className="text-parchment/85">
                {departments.map((row) => (
                  <tr key={row.department || 'none'} className="border-t border-ink-line/60">
                    <td className="px-4 py-3">{row.department || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-right font-mono">{row.intern_count}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {row.avg_attendance_pct !== null ? `${row.avg_attendance_pct}%` : '—'}
                    </td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-parchment/40">
                      No department data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
