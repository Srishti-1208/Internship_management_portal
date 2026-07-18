const STATUS_STYLES = {
  present: { color: '#3D6952', label: 'Present' },
  absent: { color: '#A03F2E', label: 'Absent' },
  half_day: { color: '#B87A2E', label: 'Half Day' },
  leave: { color: '#4C5A60', label: 'On Leave' },
};

export default function StampBadge({ status, size = 'md' }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.absent;
  const sizing = size === 'sm' ? 'w-20 h-20 text-[9px]' : 'w-28 h-28 text-[11px]';

  return (
    <div
      className={`stamp ${sizing} font-semibold`}
      style={{ color: style.color }}
      title={style.label}
    >
      {style.label}
    </div>
  );
}