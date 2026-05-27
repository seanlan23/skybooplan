import { cn } from '@/lib/utils'

/** Lucide «Plane» pot — enaka oblika kot v izvirniku */
const PLANE_PATH =
  'M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z'

/*
 * BACKUP — dimenzije logotipa pred povečanjem +20 % (obnovi, če nov izgled ni OK):
 * Kontejner: shrink-0 w-8 h-8 rounded-lg (32×32 px)
 * SVG letalo: w-[18px] h-[18px]
 */
/** Grafični del logotipa — modri kvadrat + letalo navpično navzgor */
export function SkybooplanLogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        /* +20 %: 32px → 38px */
        'shrink-0 w-[38px] h-[38px] rounded-lg bg-sky-500 flex items-center justify-center',
        'transition-colors',
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        /* +20 %: 18px → 22px */
        className="w-[22px] h-[22px] text-white block"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/*
          Lucide Plane je v izvirniku diagonalno (~45°). Rotacija -45° okoli središča
          (12,12) usmeri nos letala točno navpično navzgor (0°).
        */}
        <g transform="rotate(-45 12 12)">
          <path d={PLANE_PATH} />
        </g>
      </svg>
    </div>
  )
}
