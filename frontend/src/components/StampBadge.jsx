const STATUS_STYLES = {
  present: { color: '#4C7A63', label: 'Present' },
  absent: { color: '#B14B3D', label: 'Absent' },
  half_day: { color: '#C98A3E', label: 'Half Day' },
  leave: { color: '#5B6B70', label: 'On Leave' },
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
