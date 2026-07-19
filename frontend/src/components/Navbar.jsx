  import { Link, useNavigate, useLocation } from 'react-router-dom';
  import { useAuth } from '../context/AuthContext';

  export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (!user) return null;

    function handleLogout() {
      logout();
      navigate('/login');
    }

    const links = [
      { to: '/attendance', label: 'Attendance' },
      { to: '/tasks', label: 'Tasks' },
      ...(user.role !== 'intern' ? [{ to: '/analytics', label: 'Analytics' }] : []),
      { to: '/programs', label: user.role === 'intern' ? 'My Program' : 'Programs' },
      ...(user.role === 'admin' ? [{ to: '/applications', label: 'Applications' }] : []),
      { to: '/announcements', label: 'Announcements' },
      { to: '/certificates', label: 'Certificates' },
    ];

    return (
      <header className="border-b border-ink-line bg-ink/95 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/attendance" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full border-2 border-stamp-amber text-stamp-amber flex items-center justify-center font-mono text-xs -rotate-6">
              IP
            </span>
            <span className="font-display text-lg text-parchment tracking-tight">Ledger</span>
          </Link>

          <nav className="flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === l.to
                    ? 'bg-parchment text-parchment-text'
                    : 'text-parchment/70 hover:text-parchment hover:bg-ink-panel'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-parchment leading-tight">{user.name}</p>
              <p className="text-[11px] font-mono uppercase tracking-wider text-parchment/50 leading-tight">
                {user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-parchment/60 hover:text-stamp-red transition-colors font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>
    );
  }
