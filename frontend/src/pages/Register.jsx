import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'intern', department: '' });
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
      await register(form);
      navigate('/attendance');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl text-parchment">Create an account</h1>
          <p className="text-parchment/50 text-sm mt-1.5">Join the program roster.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-ink-panel border border-ink-line rounded-xl p-7 space-y-4">
          {error && (
            <p className="text-sm text-stamp-red bg-stamp-red/10 border border-stamp-red/30 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
              Full name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
              Email
            </label>
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
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-parchment/50 mb-1.5">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => update('role', e.target.value)}
                className="w-full bg-ink border border-ink-line rounded-md px-3 py-2.5 text-parchment focus:outline-none focus:ring-2 focus:ring-stamp-amber/50"
              >
                <option value="intern">Intern</option>
                <option value="mentor">Mentor</option>
                <option value="admin">Admin</option>
              </select>
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-parchment text-parchment-text font-semibold rounded-md py-2.5 hover:bg-parchment-dim transition-colors disabled:opacity-60"
          >
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-parchment/45 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-stamp-amber hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
