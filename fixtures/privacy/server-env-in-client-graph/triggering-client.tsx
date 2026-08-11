'use client'

// This component is the client boundary. It reads no environment variables
// itself — the finding belongs to the helper it pulls into the browser.
import { apiBaseUrl, featureFlags } from './config'

export function SearchBox() {
  return (
    <form action={`${apiBaseUrl}/search`}>
      <label htmlFor="q">Search</label>
      <input id="q" name="q" type="search" />
      {featureFlags.showAdvanced ? <button type="button">Advanced</button> : null}
    </form>
  )
}
