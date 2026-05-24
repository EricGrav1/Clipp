import { cn } from "@/components/ui/utils";

type BearFarmerProps = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Barnaby — the Clip Farmer mascot. A friendly bear in a straw hat and
 * denim overalls, hand-built as flat SVG so it stays crisp at any size and
 * picks up the brand green on its hat band + shirt.
 */
export function BearFarmer({
  size = 96,
  className,
  title = "Barnaby the Clip Farmer bear",
}: BearFarmerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 124"
      fill="none"
      role="img"
      aria-label={title}
      className={cn("select-none", className)}
    >
      <title>{title}</title>

      {/* ---- Body: shirt + denim overalls ---- */}
      <path
        d="M26 124c0-20 15-34 34-34s34 14 34 34Z"
        fill="hsl(var(--accent))"
      />
      {/* overalls bib */}
      <path
        d="M44 96c0-3 2-5 5-5h22c3 0 5 2 5 5v28H44Z"
        fill="#4d83ad"
      />
      {/* straps */}
      <path d="M47 92 41 124h7l4-30Z" fill="#5a93bf" />
      <path d="M73 92 79 124h-7l-4-30Z" fill="#5a93bf" />
      {/* buttons */}
      <circle cx="50" cy="100" r="2.6" fill="#e7c26a" />
      <circle cx="70" cy="100" r="2.6" fill="#e7c26a" />

      {/* ---- Ears ---- */}
      <circle cx="34" cy="34" r="14" fill="#a9743f" />
      <circle cx="86" cy="34" r="14" fill="#a9743f" />
      <circle cx="34" cy="34" r="7" fill="#8a5d31" />
      <circle cx="86" cy="34" r="7" fill="#8a5d31" />

      {/* ---- Head ---- */}
      <ellipse cx="60" cy="58" rx="35" ry="33" fill="#b07a45" />

      {/* cheeks */}
      <circle cx="40" cy="68" r="6" fill="#e1907c" opacity="0.7" />
      <circle cx="80" cy="68" r="6" fill="#e1907c" opacity="0.7" />

      {/* muzzle */}
      <ellipse cx="60" cy="71" rx="19" ry="15" fill="#ecd6ab" />
      {/* nose */}
      <ellipse cx="60" cy="64" rx="5.4" ry="3.8" fill="#4a3526" />
      {/* mouth */}
      <path
        d="M60 68v5m0 0c-3.5 0-6-2-6-2m6 2c3.5 0 6-2 6-2"
        stroke="#4a3526"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />

      {/* eyes */}
      <circle cx="47" cy="55" r="3.6" fill="#3a2a1e" />
      <circle cx="73" cy="55" r="3.6" fill="#3a2a1e" />
      <circle cx="48.2" cy="53.8" r="1.1" fill="#fff" />
      <circle cx="74.2" cy="53.8" r="1.1" fill="#fff" />

      {/* ---- Straw hat ---- */}
      <ellipse cx="60" cy="40" rx="46" ry="11" fill="#e7c26a" />
      <ellipse cx="60" cy="40" rx="46" ry="11" fill="none" stroke="#cba746" strokeWidth="1.5" />
      {/* crown */}
      <path
        d="M38 39c0-13 9-22 22-22s22 9 22 22Z"
        fill="#edcd7a"
      />
      {/* hat band — brand green */}
      <path
        d="M38 39c0-4 .5-7 1.3-10h41.4c.8 3 1.3 6 1.3 10Z"
        fill="hsl(var(--primary))"
      />
    </svg>
  );
}
