export function FluidGlassFilters() {
  return (
    <svg className="sr-only fixed hidden w-0 h-0 pointer-events-none" aria-hidden="true">
      <defs>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="13" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 13 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
        <filter id="remove-black" colorInterpolationFilters="sRGB">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  -255 -255 -255 0 1"
            result="black-pixels"
          />
          <feComposite in="SourceGraphic" in2="black-pixels" operator="out" />
        </filter>
      </defs>
    </svg>
  );
}
