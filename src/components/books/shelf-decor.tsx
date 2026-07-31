/**
 * Purely decorative props that share the shelf with the books — a potted
 * plant and a small stack of books lying flat, as on a real shelf.
 *
 * Inline SVG on purpose: no network request, and both drawings inherit the
 * theme through CSS variables.
 */

export function ShelfPlant() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 64 88"
      className="pointer-events-none h-[88px] w-16 shrink-0 self-end"
    >
      <g fill="var(--leaf)">
        <ellipse cx="20" cy="34" rx="11" ry="8" />
        <ellipse cx="44" cy="30" rx="10" ry="7" />
        <ellipse cx="32" cy="20" rx="9" ry="7" />
      </g>
      <g fill="var(--leaf-deep)">
        <ellipse cx="30" cy="38" rx="9" ry="6" />
        <ellipse cx="46" cy="42" rx="8" ry="6" />
      </g>
      <g fill="var(--bloom)">
        <circle cx="18" cy="18" r="3.5" />
        <circle cx="46" cy="16" r="3" />
        <circle cx="33" cy="9" r="2.5" />
      </g>
      <path
        d="M14 52h36l-5 30a4 4 0 0 1-4 3.5H23a4 4 0 0 1-4-3.5z"
        fill="var(--pot)"
      />
      <rect x="11" y="46" width="42" height="8" rx="3" fill="var(--pot)" />
    </svg>
  );
}

export function ShelfBookStack() {
  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 72 34"
      className="pointer-events-none h-[34px] w-[72px] shrink-0 self-end"
    >
      <rect x="2" y="24" width="68" height="9" rx="2" fill="var(--spine-7)" />
      <rect x="6" y="14" width="60" height="9" rx="2" fill="var(--spine-2)" />
      <rect x="12" y="4" width="48" height="9" rx="2" fill="var(--spine-4)" />
      <g fill="var(--spine-band)">
        <rect x="2" y="27" width="68" height="1" />
        <rect x="6" y="17" width="60" height="1" />
        <rect x="12" y="7" width="48" height="1" />
      </g>
    </svg>
  );
}
