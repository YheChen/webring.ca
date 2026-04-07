import { forceSimulation, forceRadial, forceCollide, forceManyBody, forceLink, type SimulationNodeDatum, type SimulationLinkDatum } from 'd3-force'
import { select } from 'd3-selection'
import { drag } from 'd3-drag'

interface RingMember extends SimulationNodeDatum {
  slug: string
  name: string
  url: string
  city?: string
  type: string
}

interface RingLink extends SimulationLinkDatum<RingMember> {
  source: number
  target: number
}

function extractDomain(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

function buildLinks(members: RingMember[]): RingLink[] {
  const n = members.length
  const seen = new Set<string>()
  const links: RingLink[] = []

  function addLink(a: number, b: number) {
    const key = [Math.min(a, b), Math.max(a, b)].join('-')
    if (seen.has(key)) return
    seen.add(key)
    links.push({ source: a, target: b })
  }

  // Adjacent ring links
  for (let i = 0; i < n; i++) {
    addLink(i, (i + 1) % n)
  }

  // Cross-links: hash slug to pick 1-2 non-adjacent targets
  for (let i = 0; i < n; i++) {
    const slug = members[i].slug
    let hash = 0
    for (let c = 0; c < slug.length; c++) {
      hash = ((hash << 5) - hash + slug.charCodeAt(c)) | 0
    }
    const offset = 2 + (Math.abs(hash) % Math.max(1, n - 3))
    addLink(i, (i + offset) % n)
    // Second cross-link for larger rings
    if (n > 5) {
      const offset2 = 3 + (Math.abs(hash >> 8) % Math.max(1, n - 4))
      addLink(i, (i + offset2) % n)
    }
  }

  return links
}

function init() {
  const container = document.getElementById('ring-viz')
  const dataEl = document.getElementById('ring-data')
  if (!container || !dataEl) return

  const members: RingMember[] = JSON.parse(dataEl.textContent ?? '[]')
  if (!members.length) return

  // Dimensions
  const width = 400
  const height = 400
  const cx = width / 2
  const cy = height / 2
  const ringRadius = 130
  const nodeR = 5
  const driftAlpha = 0.008

  // Initial positions on the ring
  members.forEach((m, i) => {
    const angle = (i / members.length) * Math.PI * 2 - Math.PI / 2
    m.x = cx + Math.cos(angle) * ringRadius
    m.y = cy + Math.sin(angle) * ringRadius
  })

  // Build mesh links
  const linkData = buildLinks(members)

  // Viewbox pan state
  let vx = 0
  let vy = 0

  // SVG
  const svg = select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('class', 'directory-ring-svg')
    .style('cursor', 'grab')

  // Pan: drag on SVG background to move the viewBox
  let panStartX = 0
  let panStartY = 0
  let panStartVx = 0
  let panStartVy = 0

  const svgEl = svg.node()!

  function getScale(): number {
    const rect = svgEl.getBoundingClientRect()
    return width / rect.width
  }

  const panBehavior = drag<SVGSVGElement, unknown>()
    .filter((event) => {
      // Only pan when dragging the background, not nodes
      const target = event.target as Element
      return !target.closest('.ring-node')
    })
    .on('start', (event) => {
      panStartX = event.x
      panStartY = event.y
      panStartVx = vx
      panStartVy = vy
      svg.style('cursor', 'grabbing')
    })
    .on('drag', (event) => {
      const scale = getScale()
      vx = panStartVx - (event.x - panStartX) * scale
      vy = panStartVy - (event.y - panStartY) * scale
      svg.attr('viewBox', `${vx} ${vy} ${width} ${height}`)
    })
    .on('end', () => {
      svg.style('cursor', 'grab')
    })

  svg.call(panBehavior)

  // Ghost ring path
  svg.append('circle')
    .attr('cx', cx)
    .attr('cy', cy)
    .attr('r', ringRadius)
    .attr('class', 'ring-ghost-path')

  // Links
  const linkGroup = svg.append('g').attr('class', 'ring-links')
  const linkEls = linkGroup.selectAll<SVGLineElement, RingLink>('line')
    .data(linkData)
    .join('line')
    .attr('class', 'ring-link-line')

  // Node groups
  const nodeGroup = svg.append('g').attr('class', 'ring-nodes')
  const nodes = nodeGroup
    .selectAll<SVGGElement, RingMember>('g')
    .data(members)
    .join('g')
    .attr('class', 'ring-node')
    .attr('id', d => `ring-node-${d.slug}`)

  // Node dots
  nodes.append('circle')
    .attr('r', nodeR)
    .attr('class', 'ring-node-dot')

  // Domain labels
  nodes.append('text')
    .attr('class', 'ring-node-label')
    .attr('dy', nodeR + 10)
    .text(d => extractDomain(d.url))

  // Tooltip
  const tooltip = svg.append('g').attr('class', 'ring-tooltip')
  const tooltipBg = tooltip.append('rect').attr('class', 'ring-tooltip-bg')
  const tooltipName = tooltip.append('text').attr('class', 'ring-tooltip-name')
  const tooltipMeta = tooltip.append('text').attr('class', 'ring-tooltip-meta')

  // Click to visit
  nodes.on('click', (_event, d) => {
    window.open(d.url, '_blank', 'noopener,noreferrer')
  })

  // Force simulation — loose ring with visible links
  const simulation = forceSimulation<RingMember>(members)
    .force('link', forceLink<RingMember, RingLink>(linkData).distance(60).strength(0.03))
    .force('radial', forceRadial<RingMember>(ringRadius, cx, cy).strength(0.06))
    .force('collide', forceCollide<RingMember>(nodeR + 4).strength(0.5))
    .force('charge', forceManyBody<RingMember>().strength(-15).distanceMax(ringRadius * 2))
    .alphaDecay(0.01)
    .velocityDecay(0.3)
    .on('tick', ticked)

  // Start gentle drift after initial settle
  setTimeout(() => {
    simulation.alphaTarget(driftAlpha).restart()
  }, 3000)

  function ticked() {
    nodes.attr('transform', d => `translate(${d.x},${d.y})`)
    linkEls
      .attr('x1', d => (d.source as unknown as RingMember).x!)
      .attr('y1', d => (d.source as unknown as RingMember).y!)
      .attr('x2', d => (d.target as unknown as RingMember).x!)
      .attr('y2', d => (d.target as unknown as RingMember).y!)
  }

  // Drag behavior
  const dragBehavior = drag<SVGGElement, RingMember>()
    .on('start', (event, d) => {
      if (!event.active) simulation.alphaTarget(0.4).restart()
      d.fx = d.x
      d.fy = d.y
    })
    .on('drag', (event, d) => {
      d.fx = event.x
      d.fy = event.y
    })
    .on('end', (event, d) => {
      if (!event.active) simulation.alphaTarget(driftAlpha)
      d.fx = null
      d.fy = null
    })

  nodes.call(dragBehavior)

  // Bloom hover helpers
  const ringWrap = container.closest('.directory-ring-wrap')

  function showBloom(slug: string) {
    ringWrap?.classList.add('has-highlight')
    document.getElementById(`ring-node-${slug}`)?.classList.add('is-highlighted')

    // Highlight connected links
    linkEls.each(function (d) {
      const s = d.source as unknown as RingMember
      const t = d.target as unknown as RingMember
      if (s.slug === slug || t.slug === slug) {
        (this as SVGLineElement).classList.add('is-highlighted')
      }
    })

    // Highlight directory row
    document.querySelector(`.directory-row[data-member="${slug}"]`)?.classList.add('is-hovered')

    // Show tooltip
    const member = members.find(m => m.slug === slug)
    if (member) {
      const name = member.name
      const meta = member.city || ''
      tooltipName.text(name)
      tooltipMeta.text(meta)

      // Position tooltip above node
      const tx = member.x!
      const ty = member.y! - nodeR - 22

      tooltipName.attr('x', tx).attr('y', ty)
      tooltipMeta.attr('x', tx).attr('y', ty + 11)
      tooltipName.attr('text-anchor', 'middle')
      tooltipMeta.attr('text-anchor', 'middle')

      // Size background
      const nameLen = name.length * 5.5
      const metaLen = meta.length * 4.5
      const bgW = Math.max(nameLen, metaLen) + 16
      const bgH = 28
      tooltipBg.attr('x', tx - bgW / 2).attr('y', ty - 12).attr('width', bgW).attr('height', bgH)

      tooltip.classed('is-visible', true)
    }
  }

  function hideBloom() {
    ringWrap?.classList.remove('has-highlight')
    document.querySelectorAll('.ring-node.is-highlighted').forEach(el => el.classList.remove('is-highlighted'))
    document.querySelectorAll('.ring-link-line.is-highlighted').forEach(el => el.classList.remove('is-highlighted'))
    document.querySelectorAll('.directory-row.is-hovered').forEach(el => el.classList.remove('is-hovered'))
    tooltip.classed('is-visible', false)
  }

  // Directory list <-> ring hover interaction
  const rows = document.querySelectorAll<HTMLElement>('.directory-row[data-member]')

  rows.forEach(row => {
    const slug = row.getAttribute('data-member')
    if (!slug) return
    row.addEventListener('mouseenter', () => showBloom(slug))
    row.addEventListener('mouseleave', () => hideBloom())
  })

  // Ring node hover -> bloom
  nodes
    .on('mouseenter', (_event, d) => showBloom(d.slug))
    .on('mouseleave', () => hideBloom())
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
