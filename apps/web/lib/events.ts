/**
 * First-party, cookieless event capture.
 *
 * The site says it runs no third-party analytics and sets no tracking cookies,
 * and that has to keep being true — the privacy policy is a claim like any
 * other. So this:
 *
 *  - posts to our own origin only, never to a third party;
 *  - sets no cookie and stores no identifier;
 *  - sends no URL parameters, no referrer beyond the host, and nothing that
 *    identifies a person;
 *  - honours Global Privacy Control and Do Not Track by not sending at all;
 *  - is disabled entirely unless NEXT_PUBLIC_ATTEST_EVENTS is set, which it is
 *    not in this repository.
 *
 * The cost of those constraints is real and worth stating: without a stable
 * identifier we can count events but cannot attribute a later Action install
 * back to a session. That is why the objective contract records
 * `github_action_installed_per_unique_visitor` as the metric we want and
 * `install_command_copied` as the proxy we can actually observe.
 */

export interface TrackedEvent {
  event: string
  /** Which page variant produced it, for experiment analysis. */
  variant: string
  /** Which experiment arm, when the page is under test. */
  experiment?: string
}

const ENABLED = process.env.NEXT_PUBLIC_ATTEST_EVENTS === '1'

export function track(payload: TrackedEvent): void {
  if (!ENABLED) return
  if (typeof navigator === 'undefined') return

  // Both signals mean "do not record my behaviour". Recording it anyway and
  // calling it first-party would be the kind of distinction nobody outside
  // marketing accepts.
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean; doNotTrack?: string }
  const legacyDnt = (window as unknown as { doNotTrack?: string }).doNotTrack
  if (nav.globalPrivacyControl === true) return
  if (nav.doNotTrack === '1' || legacyDnt === '1') return

  const body = JSON.stringify({
    ...payload,
    // Coarse enough to be useless for identification, useful for layout work.
    viewport: window.innerWidth < 640 ? 'small' : window.innerWidth < 1024 ? 'medium' : 'large',
  })

  try {
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/e', new Blob([body], { type: 'application/json' }))
      return
    }
    void fetch('/api/e', { method: 'POST', body, keepalive: true })
  } catch {
    // Instrumentation must never break the page it measures.
  }
}
