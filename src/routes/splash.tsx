import { Hono } from 'hono'
import { raw } from 'hono/html'
import type { Bindings } from '../types'
import { getActiveMembers, getEffectiveRingOrder, getHealthStatus } from '../data'
import { SplashContent } from '../components/splash-content'
import { AboutContent } from '../components/about-content'
import { DirectoryContent } from '../components/directory-content'
import { SitePreviewContent } from '../components/preview-content'
import { JoinContent } from '../components/join-content'

const PANEL_NAMES = ['Splash', 'About', 'Directory', 'Explore', 'Join']

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  c.header('Cache-Control', 'public, max-age=300')
  const [active, ringOrder] = await Promise.all([
    getActiveMembers(c.env.WEBRING),
    getEffectiveRingOrder(c.env.WEBRING),
  ])
  const ringEntrySlug = ringOrder[0] ?? active[0]?.slug ?? ''

  const healthStatuses = await Promise.all(
    active.map((m) => getHealthStatus(c.env.WEBRING, m.slug))
  )

  const dots = PANEL_NAMES.map((name, i) =>
    `<button class="ring-dot${i === 0 ? ' is-active' : ''}" data-dot="${i}" aria-label="Go to ${name}"></button>`
  ).join('')

  const previewMembers = JSON.stringify(active.map((m, i) => ({
    name: m.name, url: m.url, city: m.city || '', slug: m.slug,
    frameable: healthStatuses[i]?.frameable ?? true,
  })))

  return c.html(
    <>
      {raw('<!DOCTYPE html>')}
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>webring.ca</title>
          <meta name="description" content="A webring for Canadian builders — developers, designers, and founders." />
          <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
          <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&amp;family=Space+Mono:wght@400;700&amp;display=swap" rel="stylesheet" />
          <link rel="stylesheet" href="/splash.css" />
        </head>
        <body>
          <div id="ring" class="ring" data-panel-count={PANEL_NAMES.length}>
            <div class="ring-track">
              {/* Clone of last panel (Join) for backward cycling */}
              <section class="panel panel--clone" aria-hidden="true">
                <JoinContent memberCount={active.length} />
              </section>

              {/* Panel 1: Splash */}
              <section class="panel" data-index="0" aria-label="Splash section">
                <SplashContent ringEntrySlug={ringEntrySlug} />
              </section>

              {/* Panel 2: About */}
              <section class="panel" data-index="1" aria-label="About section">
                <AboutContent />
              </section>

              {/* Panel 3: Directory */}
              <section class="panel" data-index="2" aria-label="Directory section">
                <DirectoryContent active={active} />
              </section>

              {/* Panel 4: Explore */}
              <section class="panel panel--alt" data-index="3" aria-label="Explore section">
                <SitePreviewContent />
              </section>

              {/* Panel 5: Join CTA */}
              <section class="panel" data-index="4" aria-label="Join section">
                <JoinContent memberCount={active.length} />
              </section>

              {/* Clone of first panel (Splash) for forward cycling */}
              <section class="panel panel--clone" aria-hidden="true">
                <SplashContent ringEntrySlug={ringEntrySlug} />
              </section>
            </div>
            <nav class="ring-dots" aria-label="Panel navigation">
              {raw(dots)}
            </nav>
          </div>

          <script src="/splash.js"></script>
          {raw(`<script>window.__PREVIEW_MEMBERS = ${previewMembers}</script>`)}
          <script src="/preview.js"></script>
          <script src="/d3-ring.js"></script>
        </body>
      </html>
    </>
  )
})

export default app
