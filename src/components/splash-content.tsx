import { raw } from 'hono/html'
import { CANADA_VIEWBOX, CANADA_OUTLINE_PATH, CANADA_REGION_PATHS } from '../lib/canada-map'

const RING_CITIES = [
  { name: 'Vancouver', x: 160.7, y: 376.1 },       // BC
  { name: 'Halifax', x: 619.5, y: 405.2 },          // NS
  { name: 'Charlottetown', x: 613.5, y: 387.2 },   // PE
  { name: "St. John's", x: 673.4, y: 327.7 },      // NL
  { name: 'Montreal', x: 539.9, y: 430.8 },         // QC
  { name: 'Fredericton', x: 589.8, y: 403.4 },      // NB
  { name: 'Winnipeg', x: 350.6, y: 411.8 },         // MB
  { name: 'Toronto', x: 500.0, y: 466.4 },          // ON
  { name: 'Saskatoon', x: 284.5, y: 380.0 },        // SK
  { name: 'Calgary', x: 230.4, y: 380.2 },          // AB
  { name: 'Whitehorse', x: 157.7, y: 225.2 },       // YT
  { name: 'Yellowknife', x: 265.0, y: 255.9 },      // NT
  { name: 'Iqaluit', x: 491.2, y: 226.0 },          // NU
]

// Perpendicular bend amount per segment — alternating direction, proportional to length
const BENDS = [40, -3, 12, -22, 8, -30, 20, -28, 8, -22, 15, -30, 35]

function curvePath(x1: number, y1: number, x2: number, y2: number, bend: number): string {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const cx = mx + (-dy / len) * bend
  const cy = my + (dx / len) * bend
  return `M${x1},${y1} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2},${y2}`
}

export function SplashContent({ ringEntrySlug }: { ringEntrySlug: string }) {
  return (
    <div class="splash-inner">
      <header>
        <h1 class="poster-text hero-top">
          <span class="stretch-wide">WEBRING</span>
          <span class="stretch-wide">FOR</span>
        </h1>
        <img src="/canada-flag.svg" alt="Flag of Canada" class="canada-flag" />
      </header>

      <div class="splash-map-wrap">
        <svg
          class="splash-map"
          viewBox={CANADA_VIEWBOX}
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Map of Canada with animated webring"
        >
          {CANADA_REGION_PATHS.map((region) => (
            <path d={region.d} class="splash-region" />
          ))}
          <path d={CANADA_OUTLINE_PATH} class="splash-outline" />
          <g class="webring-anim">
            {RING_CITIES.map((city, i) => {
              const next = RING_CITIES[(i + 1) % RING_CITIES.length]
              return (
                <path
                  d={curvePath(city.x, city.y, next.x, next.y, BENDS[i])}
                  class={`anim-line anim-line-${i}`}
                />
              )
            })}
            {RING_CITIES.map((city, i) => (
              <circle cx={city.x} cy={city.y} r="4" class={`anim-dot anim-dot-${i}`}>
                <title>{city.name}</title>
              </circle>
            ))}
          </g>
        </svg>
      </div>

      <footer>
        <div class="hero-bottom">
          <div class="hero-bottom-inner">
            <h2 class="poster-text hero-bottom-text">
              {raw('CA<span class="flag-white-outline">NA</span>DA')}
            </h2>
            <nav class="ring-widget" aria-label="Webring navigation">
              <a href={`/prev/${ringEntrySlug}`} class="ring-widget-arrow" aria-label="Previous site in ring">{raw('&larr;')}</a>
              <a href="/random" class="ring-widget-leaf" aria-label="Random site in ring">
                <img src="/maple-leaf.svg" alt="" aria-hidden="true" />
              </a>
              <a href={`/next/${ringEntrySlug}`} class="ring-widget-arrow" aria-label="Next site in ring">{raw('&rarr;')}</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  )
}
