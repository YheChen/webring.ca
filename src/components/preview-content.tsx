import { raw } from 'hono/html'

export function SitePreviewContent() {
  return (
    <div class="preview-inner" id="preview-panel">
      {/* Skeleton loading state */}
      <div class="preview-skeleton" id="preview-skeleton">
        <span class="preview-skeleton-label" id="preview-skeleton-name">Loading...</span>
        <div class="preview-skeleton-shimmer"></div>
      </div>

      {/* Iframe container — iframe injected by client-side JS */}
      <div class="preview-iframe-wrap" id="preview-iframe-wrap"></div>

      {/* Click-to-interact overlay — captures scroll, click to dismiss */}
      <div class="preview-overlay" id="preview-overlay">
        <span class="preview-overlay-hint">Click to interact</span>
      </div>

      {/* Fallback card — shown when iframe is blocked */}
      <div class="preview-fallback" id="preview-fallback" style="display: none;">
        <div class="preview-fallback-card">
          <span class="preview-fallback-name" id="preview-fallback-name"></span>
          <span class="preview-fallback-meta" id="preview-fallback-meta"></span>
          <a class="preview-fallback-link" id="preview-fallback-link" href="javascript:void(0)" target="_blank" rel="noopener noreferrer">
            Visit site {raw('&rarr;')}
          </a>
        </div>
      </div>

      {/* Controls overlay */}
      <div class="preview-controls" id="preview-controls">
        <button type="button" class="preview-nav preview-nav-prev" id="preview-prev" aria-label="Previous member">{raw('&#8592;')}</button>
        <div class="preview-info">
          <span class="preview-member-name" id="preview-name"></span>
          <span class="preview-member-sep">{raw('&middot;')}</span>
          <span class="preview-member-url" id="preview-url"></span>
        </div>
        <button type="button" class="preview-nav preview-nav-next" id="preview-next" aria-label="Next member">{raw('&#8594;')}</button>
        <span class="preview-member-city" id="preview-city"></span>
        <a class="preview-open" id="preview-open" href="javascript:void(0)" target="_blank" rel="noopener noreferrer" aria-label="Open site in new tab">{raw('<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8.667V12.667A1.333 1.333 0 0 1 10.667 14H3.333A1.333 1.333 0 0 1 2 12.667V5.333A1.333 1.333 0 0 1 3.333 4H7.333"/><path d="M10 2H14V6"/><path d="M6.667 9.333L14 2"/></svg>')}</a>
      </div>
    </div>
  )
}
