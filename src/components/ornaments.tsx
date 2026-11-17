/** Decorative SVG pieces shared by the name-board and invitation designers. All take a colour and inherit size from CSS. */

/** Temple-style corner flourish (drawn for the top-left corner; rotate for the others). */
export function Corner({ color, className = '' }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <path d="M4 60V20C4 11 11 4 20 4h40" stroke={color} strokeWidth="2" />
      <path d="M10 60V24c0-8 6-14 14-14h36" stroke={color} strokeWidth="1" opacity=".6" />
      <path d="M18 18c4-8 14-8 14 0s-10 8-14 0z" fill={color} opacity=".9" />
      <path d="M18 18c-8 4-8 14 0 14s8-10 0-14z" fill={color} opacity=".9" />
      <circle cx="18" cy="18" r="3" fill={color} />
      <circle cx="40" cy="10" r="1.6" fill={color} /><circle cx="48" cy="10" r="1.2" fill={color} /><circle cx="55" cy="10" r=".9" fill={color} />
      <circle cx="10" cy="40" r="1.6" fill={color} /><circle cx="10" cy="48" r="1.2" fill={color} /><circle cx="10" cy="55" r=".9" fill={color} />
    </svg>
  );
}

/** Four corners placed inside a relative parent. */
export function Corners({ color, inset = 'inset-2', size = 'h-12 w-12 sm:h-16 sm:w-16' }: { color: string; inset?: string; size?: string }) {
  return (
    <div className={`pointer-events-none absolute ${inset}`} aria-hidden>
      <Corner color={color} className={`absolute left-0 top-0 ${size}`} />
      <Corner color={color} className={`absolute right-0 top-0 rotate-90 ${size}`} />
      <Corner color={color} className={`absolute bottom-0 right-0 rotate-180 ${size}`} />
      <Corner color={color} className={`absolute bottom-0 left-0 -rotate-90 ${size}`} />
    </div>
  );
}

/** Line — lotus — line divider. */
export function LotusDivider({ color, className = 'mx-auto h-5 w-44' }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 180 20" className={className} fill="none" aria-hidden>
      <path d="M4 12h62M114 12h62" stroke={color} strokeWidth="1.2" />
      <circle cx="66" cy="12" r="1.8" fill={color} /><circle cx="114" cy="12" r="1.8" fill={color} />
      <path d="M90 2c5 5 5 12 0 16-5-4-5-11 0-16z" fill={color} />
      <path d="M90 18c-6-1-12-5-14-11 6 0 11 4 14 11zM90 18c6-1 12-5 14-11-6 0-11 4-14 11z" fill={color} opacity=".75" />
      <path d="M90 18c-9 1-16-2-20-6M90 18c9 1 16-2 20-6" stroke={color} strokeWidth=".8" opacity=".6" />
    </svg>
  );
}

/** Brass kuthuvilakku (lamp) crest. */
export function LampCrest({ color, flame = '#ffb703', className = 'mx-auto h-10 w-10' }: { color: string; flame?: string; className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path d="M20 2c3 4 3 7 0 9-3-2-3-5 0-9z" fill={flame} />
      <path d="M12 14h16l-2 4H14z" fill={color} />
      <rect x="18.5" y="18" width="3" height="13" fill={color} />
      <path d="M14 22h12M15 26h10" stroke={color} strokeWidth="1.4" />
      <path d="M11 37c0-4 4-6 9-6s9 2 9 6z" fill={color} />
    </svg>
  );
}

/** Mango-leaf thoranam hanging across the top of a card. */
export function Thoranam({ leaf, flower, className = 'h-6 w-full' }: { leaf: string; flower: string; className?: string }) {
  return (
    <svg viewBox="0 0 240 24" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M0 3Q120 12 240 3" stroke={flower} strokeWidth="1.2" fill="none" />
      {Array.from({ length: 13 }, (_, i) => {
        const x = 10 + i * 18.3;
        const y = 3 + Math.sin((x / 240) * Math.PI) * 4.5;
        return i % 2 === 0
          ? <path key={i} d={`M${x} ${y}c-4 4-4 11 0 16 4-5 4-12 0-16z`} fill={leaf} />
          : <circle key={i} cx={x} cy={y + 4} r="3.4" fill={flower} />;
      })}
    </svg>
  );
}
