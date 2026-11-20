/**
 * Morrow wordmark: lowercase Fraunces "morrow" with a half-risen sun sitting on
 * the second "o". Everything inherits currentColor, so it works on cream
 * (espresso) and on dark surfaces (cream) alike. Size it with font-size.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-heading inline-flex items-baseline leading-none font-semibold tracking-[-0.03em] lowercase ${className}`}
      role="img"
      aria-label="Morrow Coffee Roasters"
    >
      <span aria-hidden="true">morr</span>
      <span aria-hidden="true" className="relative inline-block">
        o
        <Sun className="absolute bottom-[0.78em] left-1/2 h-[0.42em] w-[0.84em] -translate-x-1/2" />
      </span>
      <span aria-hidden="true">w</span>
    </span>
  );
}

function Sun({ className }: { className?: string }) {
  // Half disc on a horizon line with five short rays, in a 40×20 box.
  return (
    <svg
      viewBox="0 0 40 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M11 19a9 9 0 0 1 18 0Z" fill="currentColor" stroke="none" />
      <path d="M4 19h32" />
      <path d="M20 2.5v3.5M8.3 7.3l2.4 2.4M31.7 7.3l-2.4 2.4M2.5 13.5h3.5M34 13.5h3.5" />
    </svg>
  );
}
