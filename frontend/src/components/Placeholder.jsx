export function Placeholder({ label, className = "", minH = "min-h-[280px]" }) {
  return (
    <div
      className={`placeholder-block ${minH} w-full ${className}`}
      data-testid="placeholder-block"
    >
      <span className="text-[#63584D] text-lg leading-relaxed max-w-xs">
        {label}
      </span>
    </div>
  );
}
