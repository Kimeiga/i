#!/usr/bin/env node
/**
 * Sample size and sample-ratio-mismatch checks for a two-arm page experiment.
 *
 * Two commands, both of which exist to be run at the right moment:
 *
 *   power --baseline=0.03 --mde=0.5     before launching, to find out whether
 *                                       the experiment is worth running at all
 *   srm --a=5321 --b=5298               before reading the result, every time
 *
 * The power calculation usually delivers bad news, which is its value. A
 * low-traffic product that wants to detect a 5% relative lift needs hundreds of
 * thousands of visitors per arm; discovering that before launch is the
 * difference between testing a positioning and testing a verb for six months.
 */

const args = Object.fromEntries(
  process.argv.slice(3).map((arg) => {
    const [key, value] = arg.replace(/^--/, '').split('=')
    return [key, Number(value)]
  }),
)
const command = process.argv[2]

if (command === 'power') {
  const baseline = args.baseline ?? 0.03
  const mde = args.mde ?? 0.5
  const alpha = args.alpha ?? 0.05
  const power = args.power ?? 0.8

  const p1 = baseline
  const p2 = baseline * (1 + mde)
  const zAlpha = zFor(1 - alpha / 2)
  const zBeta = zFor(power)
  const pBar = (p1 + p2) / 2

  const n = Math.ceil(
    ((zAlpha * Math.sqrt(2 * pBar * (1 - pBar)) + zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) ** 2) /
      (p2 - p1) ** 2,
  )

  console.log(`Baseline conversion       ${(p1 * 100).toFixed(2)}%`)
  console.log(`Detecting a relative lift ${(mde * 100).toFixed(0)}%  (to ${(p2 * 100).toFixed(2)}%)`)
  console.log(`alpha ${alpha}, power ${power}`)
  console.log('')
  console.log(`Required visitors per arm ${n.toLocaleString()}`)
  console.log(`Total visitors            ${(n * 2).toLocaleString()}`)
  console.log('')
  if (n > 20000) {
    console.log('That is a lot of traffic for a pre-launch product. Either test a larger')
    console.log('effect — a different positioning rather than a different sentence — or')
    console.log('do qualified-buyer testing instead and accept that it is not causal.')
  }
  process.exit(0)
}

if (command === 'srm') {
  const a = args.a
  const b = args.b
  const expected = args.split ?? 0.5

  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    console.error('usage: experiment-power.mjs srm --a=<visitors> --b=<visitors> [--split=0.5]')
    process.exit(2)
  }

  const total = a + b
  const expectedA = total * expected
  const expectedB = total * (1 - expected)
  const chi = (a - expectedA) ** 2 / expectedA + (b - expectedB) ** 2 / expectedB
  // One degree of freedom; 10.83 is the 0.001 critical value. A conservative
  // threshold on purpose: an SRM false alarm costs a re-check, an SRM missed
  // costs a wrong decision.
  const mismatched = chi > 10.83

  console.log(`Arm A ${a.toLocaleString()}   Arm B ${b.toLocaleString()}`)
  console.log(`Expected split ${expected}`)
  console.log(`chi-square ${chi.toFixed(2)} (threshold 10.83, p = 0.001)`)
  console.log('')
  if (mismatched) {
    console.log('SAMPLE RATIO MISMATCH.')
    console.log('Do not read the result. The arms were not assigned as intended, so the')
    console.log('difference between them is not the difference you meant to measure.')
    console.log('Usual causes: bot filtering applied to one arm, a redirect that drops')
    console.log('assignment, caching, or an error that fails one arm before it logs.')
    process.exit(1)
  }
  console.log('No sample ratio mismatch. The result is safe to read.')
  process.exit(0)
}

console.error('usage: experiment-power.mjs power|srm [options]')
process.exit(2)

/** Inverse standard normal CDF, Acklam's rational approximation. */
function zFor(p) {
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924]
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857]
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878]
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742]
  const pLow = 0.02425

  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p <= 1 - pLow) {
    const q = p - 0.5
    const r = q * q
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  }
  const q = Math.sqrt(-2 * Math.log(1 - p))
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
}
