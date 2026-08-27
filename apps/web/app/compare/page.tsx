import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Landing page v1 vs v2',
  robots: { index: false, follow: false },
}

/**
 * The comparison page.
 *
 * It exists because "the new page is better" is an assertion, and the whole
 * method this rewrite follows says an assertion about a page is worth nothing
 * until qualified buyers or randomised traffic weigh in. Neither has happened.
 * So this page records what changed and why, and is explicit that no evidence
 * yet says the rewrite converts better.
 */

const CHANGES: { area: string; v1: string; v2: string; why: string }[] = [
  {
    area: 'Positioning',
    v1: 'Four positions in one page: risk, then mechanism, then proof, then evidence.',
    v2: 'One position — mechanism — carried from headline to CTA, with risk and proof built as separate pages for their own traffic.',
    why: 'A page that argues four positions commits to none. Blending every angle into one agreeable message is the AI average.',
  },
  {
    area: 'Headline',
    v1: '“Know what your pull request just broke.”',
    v2: '“The file with the bug in it looks fine.”',
    why: 'The first is true of any CI check. The second states the specific thing only this product can say, and the eyebrow carries the category so the hook does not have to.',
  },
  {
    area: 'Proof',
    v1: 'A fabricated example PR comment above the fold; the real scan finding appeared four sections down.',
    v2: 'The real vercel/commerce import chain is the first section, at a pinned commit, with the report linked.',
    why: 'For a product with no customers, the strongest proof available is a real finding on a codebase the reader already knows. It was being outranked by a mockup.',
  },
  {
    area: 'Traffic',
    v1: 'One page for every source.',
    v2: 'Three pages: mechanism at /, proof at /for/github, risk at /for/eaa.',
    why: 'A visitor who searched “EAA accessibility testing” and one browsing the GitHub Marketplace are at different levels of awareness. One universal homepage is the cheapest conversion mistake to make.',
  },
  {
    area: 'The false positives',
    v1: 'Not mentioned. They were on the public scan pages only.',
    v2: 'A dedicated section on the landing page, with the before and after counts.',
    why: 'In a category where vendors have overstated capability for a decade, being visibly correctable is the only trust argument available — and it is the single most testable assumption in the rewrite.',
  },
  {
    area: 'Claims',
    v1: 'Prose in a React component. Checkable only by reading it.',
    v2: 'JSON citing claim ids from a claim graph, with a linter that fails the build.',
    why: 'The forbidden-words check catches a bad phrase. It cannot catch a true-sounding sentence that nothing supports, which is the more common failure and the one the FTC fined accessiBe for.',
  },
  {
    area: 'Pricing',
    v1: 'Three tiers with “Start” buttons linking to a signup route that does not exist.',
    v2: 'The same tiers, marked “Not yet available”, with no purchase path.',
    why: 'The hosted service is written but not deployed. A buy button for something nobody can buy is the plainest kind of false claim, and v1 shipped one.',
  },
  {
    area: 'Coverage limit',
    v1: 'A bordered box below the fold-ish, hand-written into the component.',
    v2: 'A structural element in the hero renderer, sourced from the shared constant, on every variant.',
    why: 'Content a page author can shorten will eventually be shortened by someone optimising a conversion rate. Making it structural is the only version that survives.',
  },
]

export default function Compare() {
  return (
    <div className="prose-attest max-w-3xl">
      <h1>Landing page v1 vs v2</h1>

      <p>
        The first landing page is preserved verbatim at{' '}
        <Link href="/v1">/v1</Link>, from commit <code>db780e5</code>. The current one is at{' '}
        <Link href="/">/</Link>. This page records what changed and why.
      </p>

      <blockquote>
        <p>
          <strong>No evidence yet says the new page converts better.</strong> Nothing has been
          published, there is no traffic, and no qualified buyer has read either version. Every
          change below is a hypothesis with a reason, not a result. The experiment that would settle
          it is predeclared in{' '}
          <a href="https://github.com/attest-ci/attest/blob/main/gtm/conversion/experiments/exp-001.yaml">
            exp-001
          </a>{' '}
          and cannot run until there are visitors.
        </p>
      </blockquote>

      <h2>What changed</h2>

      {CHANGES.map((change) => (
        <div key={change.area}>
          <h3>{change.area}</h3>
          <table>
            <tbody>
              <tr>
                <th scope="row">v1</th>
                <td>{change.v1}</td>
              </tr>
              <tr>
                <th scope="row">v2</th>
                <td>{change.v2}</td>
              </tr>
              <tr>
                <th scope="row">Why</th>
                <td>{change.why}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      <h2>What did not change, and should not have</h2>

      <p>
        The disclaimer, the attribution to Deque, the “what Attest cannot detect” link, and the
        refusal to claim compliance are identical, because they were right the first time. The
        rewrite made them structural rather than editorial, which is a different improvement from
        making them better.
      </p>

      <h2>How to judge this</h2>

      <p>
        Not by reading it. The order of evidence, weakest to strongest:{' '}
        <em>it reads better</em> (worthless), <em>a five-second test shows people can say what the
        product does</em> (useful), <em>ten practitioners in the ICP say the mechanism section is
        credible</em> (much better), <em>randomised traffic shows more qualified Action installs per
        visitor</em> (the only one that decides anything).
      </p>

      <p>
        The pre-traffic tests are written and ready to run in{' '}
        <a href="https://github.com/attest-ci/attest/blob/main/gtm/conversion/pre-traffic-tests.md">
          pre-traffic-tests.md
        </a>
        . They are the next thing to do, and they cost nothing but a few hours.
      </p>
    </div>
  )
}
