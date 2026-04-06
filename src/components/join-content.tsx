import { raw } from 'hono/html'

export function JoinContent({ memberCount }: { memberCount: number }) {
  return (
    <div class="join-inner">
      <header class="join-top">
        <div class="join-headline poster-text">
          <span class="stretch-wide">WANT</span>
          <span class="stretch-wide join-headline-accent">IN?</span>
        </div>
        <div class="join-count">
          <span class="join-count-number">{memberCount}</span>
          <span class="join-count-label">Canadian<br />builders</span>
        </div>
      </header>

      <img src="/maple-leaf.svg" alt="" class="join-leaf" aria-hidden="true" />

      <footer class="join-bottom">
        <div class="join-steps">
          <div class="join-step">
            <span class="join-step-num">01</span>
            <span class="join-step-text">Add the widget to your site</span>
          </div>
          <div class="join-step">
            <span class="join-step-num">02</span>
            <span class="join-step-text">Add yourself to members.json</span>
          </div>
          <div class="join-step">
            <span class="join-step-num">03</span>
            <span class="join-step-text">Open a pull request</span>
          </div>
        </div>
        <a
          href="https://github.com/stanleypangg/webring.ca#join-the-ring"
          target="_blank"
          rel="noopener noreferrer"
          class="join-button"
        >
          Join on GitHub {raw('&rarr;')}
        </a>
      </footer>
    </div>
  )
}
