import { Link } from 'react-router-dom';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="text-center">
        <div className="stamp w-24 h-24 text-stamp-red text-[10px] font-semibold mx-auto mb-6">Denied</div>
        <h1 className="font-display text-2xl text-parchment mb-2">Not authorized</h1>
        <p className="text-parchment/50 text-sm mb-6">Your role doesn't have access to this page.</p>
        <Link to="/attendance" className="text-stamp-amber hover:underline text-sm">
          Back to attendance
        </Link>
      </div>
    </div>
  );
}
