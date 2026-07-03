import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import StampBadge from '../components/StampBadge';

export default function AttendancePage() {
  const { user } = useAuth();
  return user.role === 'intern' ? <InternView /> : <RosterView />;
}

function InternView() {
  const [today, setToday] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await api.get('/attendance/me');
    setHistory(res.data.attendance);
    const todayStr = new Date().toISOString().slice(0, 10);
    setToday(res.data.attendance.find((a) => a.date.slice(0, 10) === todayStr) || null);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCheckIn() {
    setError('');
    setBusy(true);
    try {
      await api.post('/attendance/checkin');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not check in.');
    } finally {
      setBusy(false);
    }
  }

  async function handleCheckOut() {
    setError('');
    setBusy(true);
    try {
      await api.post('/attendance/checkout');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not check out.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display text-3xl text-parchment mb-1">Today's entry</h1>
      <p className="text-parchment/50 text-sm mb-8">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      {error && (
        <p className="text-sm text-stamp-red bg-stamp-red/10 border border-stamp-red/30 rounded-md px-3 py-2 mb-6">
          {error}
        </p>
      )}

      <div className="bg-parchment paper-texture rounded-xl p-8 flex items-center justify-between gap-8 mb-10">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-parchment-text/50 mb-3">Status</p>
          <div className="space-y-2 font-mono text-sm text-parchment-text">
            <p>
              Check-in:{' '}
              <span className="font-semibold">
                {today?.check_in ? new Date(today.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </p>
            <p>
              Check-out:{' '}
              <span className="font-semibold">
                {today?.check_out ? new Date(today.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </span>
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCheckIn}
              disabled={busy || today?.check_in}
              className="bg-stamp-green text-parchment font-semibold rounded-md px-5 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
            >
              Check in
            </button>
            <button
              onClick={handleCheckOut}
              disabled={busy || !today?.check_in || today?.check_out}
              className="bg-parchment-text text-parchment font-semibold rounded-md px-5 py-2.5 text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-125 transition"
            >
              Check out
            </button>
          </div>
        </div>

        {today && <StampBadge status={today.status} />}
      </div>

      <h2 className="font-display text-xl text-parchment mb-4">Recent history</h2>
      <div className="ledger-rule border border-ink-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-parchment/45 font-mono text-xs uppercase tracking-wider">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Check-in</th>
              <th className="px-4 py-3">Check-out</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="text-parchment/85">
            {history.map((row) => (
              <tr key={row.id} className="border-t border-ink-line/60">
                <td className="px-4 py-3 font-mono">{row.date.slice(0, 10)}</td>
                <td className="px-4 py-3 font-mono">
                  {row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-4 py-3 font-mono">
                  {row.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-parchment/40">
                  No attendance recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RosterView() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ status: '', department: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.department) params.department = filters.department;
    const res = await api.get('/attendance', { params });
    setRecords(res.data.attendance);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  async function overrideStatus(id, status) {
    await api.put(`/attendance/${id}`, { status });
    load();
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-parchment mb-1">Attendance roster</h1>
          <p className="text-parchment/50 text-sm">Daily check-in records for your interns.</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="bg-ink-panel border border-ink-line rounded-md px-3 py-2 text-sm text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
          >
            <option value="">All statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="half_day">Half day</option>
            <option value="leave">Leave</option>
          </select>
          <input
            placeholder="Filter by department"
            value={filters.department}
            onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
            className="bg-ink-panel border border-ink-line rounded-md px-3 py-2 text-sm text-parchment placeholder:text-parchment/30 focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
          />
        </div>
      </div>

      <div className="border border-ink-line rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-parchment/45 font-mono text-xs uppercase tracking-wider bg-ink-panel">
              <th className="px-4 py-3">Intern</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Check-in</th>
              <th className="px-4 py-3">Check-out</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Override</th>
            </tr>
          </thead>
          <tbody className="text-parchment/85">
            {records.map((row) => (
              <tr key={row.id} className="border-t border-ink-line/60">
                <td className="px-4 py-3">{row.intern_name}</td>
                <td className="px-4 py-3 text-parchment/60">{row.department || '—'}</td>
                <td className="px-4 py-3 font-mono">{row.date.slice(0, 10)}</td>
                <td className="px-4 py-3 font-mono">
                  {row.check_in ? new Date(row.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-4 py-3 font-mono">
                  {row.check_out ? new Date(row.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusPill status={row.status} />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={row.status}
                    onChange={(e) => overrideStatus(row.id, e.target.value)}
                    className="bg-ink border border-ink-line rounded-md px-2 py-1 text-xs text-parchment focus:outline-none focus:ring-1 focus:ring-stamp-amber/50"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="half_day">Half day</option>
                    <option value="leave">Leave</option>
                  </select>
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-parchment/40">
                  No records match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    present: 'text-stamp-green border-stamp-green/40 bg-stamp-green/10',
    absent: 'text-stamp-red border-stamp-red/40 bg-stamp-red/10',
    half_day: 'text-stamp-amber border-stamp-amber/40 bg-stamp-amber/10',
    leave: 'text-stamp-slate border-stamp-slate/40 bg-stamp-slate/10',
  };
  const labels = { present: 'Present', absent: 'Absent', half_day: 'Half day', leave: 'Leave' };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
