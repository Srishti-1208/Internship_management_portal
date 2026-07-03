export default function StatCard({ label, value, accent = 'text-parchment', suffix = '' }) {
  return (
    <div className="bg-ink-panel border border-ink-line rounded-lg p-5">
      <p className="text-[11px] font-mono uppercase tracking-wider text-parchment/45 mb-2">{label}</p>
      <p className={`font-display text-3xl ${accent}`}>
        {value}
        <span className="text-lg text-parchment/40 ml-1">{suffix}</span>
      </p>
    </div>
  );
}
