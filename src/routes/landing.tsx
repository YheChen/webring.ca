import { Hono } from 'hono'
import { raw } from 'hono/html'
import type { Bindings } from '../types'
import { getRingOrder, getActiveMembers } from '../data'
import Layout from '../templates/Layout'

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  c.header('Cache-Control', 'public, max-age=300')
  const [order, active] = await Promise.all([
    getRingOrder(c.env.WEBRING),
    getActiveMembers(c.env.WEBRING),
  ])

  const activeSlugs = new Set(active.map((m) => m.slug))
  const ring = order.filter((s) => activeSlugs.has(s))
  const first = ring[0]
  const last = ring[ring.length - 1]

  return c.html(
    <Layout fullHeight>
      {raw(`<style>
        .landing { display: flex; flex: 1; min-height: 0; }
        .landing-left {
          flex: 0 0 42%;
          padding: 2.5rem 2.5rem 1.5rem;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e0ddd8;
        }
        .landing-headline {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 0.6rem;
        }
        .landing-tagline {
          font-size: 0.9rem;
          color: #888;
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        .ring-widget {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: #999;
          padding: 0.7rem 0;
          margin-bottom: 1.75rem;
          border-bottom: 1px solid #e0ddd8;
        }
        .ring-widget a { color: #c22; text-decoration: none; }
        .ring-widget a:hover { opacity: 0.7; }
        .ring-dot { color: #ddd; }
        .members-label {
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #aaa;
          margin-bottom: 0.6rem;
        }
        .member-list { list-style: none; padding-left: 0; }
        .member-list li {
          padding: 0.55rem 0;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .member-list li:first-child { border-top: 1px solid #eee; }
        .member-list-name {
          font-size: 0.92rem;
          font-weight: 600;
          color: #1a1a1a;
          text-decoration: none;
        }
        .member-list-name:hover { color: #c22; }
        .member-list-meta {
          font-family: 'Space Mono', monospace;
          font-size: 0.7rem;
          color: #aaa;
        }
        .join-block {
          margin-top: 1.5rem;
          padding: 1rem 1.1rem;
          background: #f3f1ed;
          border-radius: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .join-block-text { font-size: 0.82rem; color: #666; }
        .join-block-text strong { color: #1a1a1a; font-weight: 600; }
        .join-block-link {
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: #c22;
          text-decoration: none;
          font-weight: 700;
        }
        .join-block-link:hover { opacity: 0.7; }
        .landing-right {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 1.25rem 1.5rem;
          gap: 1rem;
        }
        .landing-right-placeholder {
          flex: 1;
          background: #f0eee9;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Mono', monospace;
          font-size: 0.75rem;
          color: #bbb;
        }
        .flag-container {
          flex: 1.1;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        .flag-canvas {
          width: 100%;
          height: 100%;
          display: block;
        }
        .flag-static {
          display: flex;
          width: 100%;
          height: 100%;
        }
        .flag-red { flex: 0 0 25%; background: #d42c2c; }
        .flag-white {
          flex: 0 0 50%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .flag-white svg { width: 35%; height: auto; fill: #d42c2c; }
        @media (prefers-reduced-motion: reduce) {
          .flag-canvas { display: none; }
        }
        @media (prefers-reduced-motion: no-preference) {
          .flag-static { display: none; }
        }
        @media (prefers-color-scheme: dark) {
          .landing-left { border-right-color: #2a2927; }
          .landing-tagline { color: #777; }
          .ring-widget { border-bottom-color: #2a2927; color: #555; }
          .ring-widget a { color: #f55; }
          .ring-dot { color: #333; }
          .members-label { color: #555; }
          .member-list li { border-bottom-color: #2a2927; }
          .member-list li:first-child { border-top-color: #2a2927; }
          .member-list-name { color: #e0ddd8; }
          .member-list-name:hover { color: #f55; }
          .member-list-meta { color: #555; }
          .join-block { background: #1a1918; }
          .join-block-text { color: #888; }
          .join-block-text strong { color: #e0ddd8; }
          .join-block-link { color: #f55; }
          .landing-right-placeholder { background: #1a1918; color: #444; }
          .flag-white { background: #f5f5f5; }
        }
        @media (max-width: 767px) {
          .landing { flex-direction: column; }
          .landing-left {
            flex: none;
            border-right: none;
            border-bottom: 1px solid #e0ddd8;
            padding: 1.5rem;
          }
          .landing-right { padding: 1rem; }
        }
      </style>`)}
      <div class="landing">
        <div class="landing-left">
          <h1 class="landing-headline">Canadian builders,<br />linked together</h1>
          <p class="landing-tagline">A webring for developers, designers, and founders sharing their work on the open web.</p>

          <div class="ring-widget">
            {last ? <a href={`/prev/${last}`}>← prev</a> : <span>← prev</span>}
            <span class="ring-dot">·</span>
            <span>ring navigation</span>
            <span class="ring-dot">·</span>
            {first ? <a href={`/next/${first}`}>next →</a> : <span>next →</span>}
          </div>

          <div class="members-label">Members</div>
          {active.length === 0 ? (
            <p>No members yet.</p>
          ) : (
            <ul class="member-list">
              {active.map((m) => (
                <li>
                  <a href={m.url} target="_blank" rel="noopener" class="member-list-name">{m.name}</a>
                  <span class="member-list-meta">{m.city ?? ''}{m.city ? ' · ' : ''}{m.type}</span>
                </li>
              ))}
            </ul>
          )}

          <div class="join-block">
            <div class="join-block-text">
              <strong>{active.length} member{active.length !== 1 ? 's' : ''}</strong> across Canada
            </div>
            <a href="/join" class="join-block-link">Join the ring →</a>
          </div>
        </div>

        <div class="landing-right">
          <div class="flag-container">
            <div class="flag-static">
              <div class="flag-red" />
              <div class="flag-white">
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 5 L53 20 L63 15 L58 28 L72 25 L62 35 L75 40 L60 42 L65 55 L55 48 L55 65 L50 58 L45 65 L45 48 L35 55 L40 42 L25 40 L38 35 L28 25 L42 28 L37 15 L47 20 Z" />
                  <rect x="45" y="62" width="10" height="15" />
                </svg>
              </div>
              <div class="flag-red" />
            </div>
            <canvas class="flag-canvas" id="flag-canvas" />
          </div>

          <div class="landing-right-placeholder">Map (next task)</div>
        </div>
      </div>
      {raw(`<script>(function() {
  var c = document.getElementById('flag-canvas');
  if (!c || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var ctx = c.getContext('2d');
  var W, H, cols = 40, rows = 25, pts = [], stiffness = 0.4, damping = 0.97;

  function resize() {
    var r = c.parentElement.getBoundingClientRect();
    W = c.width = r.width * devicePixelRatio;
    H = c.height = r.height * devicePixelRatio;
    c.style.width = r.width + 'px';
    c.style.height = r.height + 'px';
    ctx.scale(devicePixelRatio, devicePixelRatio);
    W = r.width; H = r.height;
    init();
  }

  function init() {
    pts = [];
    for (var y = 0; y <= rows; y++) {
      for (var x = 0; x <= cols; x++) {
        pts.push({
          x: (x / cols) * W, y: (y / rows) * H,
          ox: (x / cols) * W, oy: (y / rows) * H,
          vx: 0, vy: 0,
          pinned: x === 0
        });
      }
    }
  }

  function step(t) {
    var wind = Math.sin(t * 0.001) * 0.8 + Math.sin(t * 0.0023) * 0.4;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (p.pinned) continue;
      var col = i % (cols + 1);
      var fx = wind * (col / cols) * 1.2 + Math.sin(t * 0.002 + col * 0.3) * 0.3;
      var fy = Math.sin(t * 0.0015 + col * 0.2) * 0.15;
      p.vx = (p.vx + fx) * damping;
      p.vy = (p.vy + fy) * damping;
      p.x += p.vx;
      p.y += p.vy;
    }
    for (var iter = 0; iter < 3; iter++) {
      for (var y = 0; y <= rows; y++) {
        for (var x = 0; x <= cols; x++) {
          var i = y * (cols + 1) + x;
          var p = pts[i];
          if (x < cols) constrain(p, pts[i + 1], W / cols);
          if (y < rows) constrain(p, pts[i + cols + 1], H / rows);
        }
      }
    }
  }

  function constrain(a, b, rest) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
    var diff = (dist - rest) / dist * stiffness;
    if (!a.pinned) { a.x += dx * diff * 0.5; a.y += dy * diff * 0.5; }
    if (!b.pinned) { b.x -= dx * diff * 0.5; b.y -= dy * diff * 0.5; }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    var redEnd = 0.25, whiteEnd = 0.75;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var i = y * (cols + 1) + x;
        var a = pts[i], b = pts[i+1], c2 = pts[i+cols+1], d = pts[i+cols+2];
        var cx = (x + 0.5) / cols;
        var color;
        if (cx < redEnd || cx >= whiteEnd) color = '#d42c2c';
        else color = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(d.x, d.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }
    }
    var leafCx = 0, leafCy = 0, count = 0;
    for (var y2 = Math.floor(rows*0.2); y2 < Math.floor(rows*0.8); y2++) {
      for (var x2 = Math.floor(cols*0.35); x2 < Math.floor(cols*0.65); x2++) {
        var idx = y2*(cols+1)+x2;
        leafCx += pts[idx].x; leafCy += pts[idx].y; count++;
      }
    }
    leafCx /= count; leafCy /= count;
    var leafSize = Math.min(W, H) * 0.22;
    ctx.save();
    ctx.translate(leafCx, leafCy);
    ctx.fillStyle = '#d42c2c';
    ctx.beginPath();
    var s = leafSize / 50;
    ctx.moveTo(0*s, -45*s);
    ctx.lineTo(3*s, -25*s); ctx.lineTo(13*s, -30*s); ctx.lineTo(8*s, -17*s);
    ctx.lineTo(22*s, -20*s); ctx.lineTo(12*s, -10*s); ctx.lineTo(25*s, -5*s);
    ctx.lineTo(10*s, -3*s); ctx.lineTo(15*s, 10*s); ctx.lineTo(5*s, 3*s);
    ctx.lineTo(5*s, 20*s); ctx.lineTo(0*s, 13*s); ctx.lineTo(-5*s, 20*s);
    ctx.lineTo(-5*s, 3*s); ctx.lineTo(-15*s, 10*s); ctx.lineTo(-10*s, -3*s);
    ctx.lineTo(-25*s, -5*s); ctx.lineTo(-12*s, -10*s); ctx.lineTo(-22*s, -20*s);
    ctx.lineTo(-8*s, -17*s); ctx.lineTo(-13*s, -30*s); ctx.lineTo(-3*s, -25*s);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-2.5*s, 15*s, 5*s, 12*s);
    ctx.restore();
  }

  function loop(t) {
    step(t);
    draw();
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(loop);
})()</script>`)}
    </Layout>
  )
})

export default app
