'use client'

import { useState } from 'react'

// A leaf client component: the smallest thing that needs browser state.
export function TabSwitcher() {
  const [tab, setTab] = useState('summary')
  return (
    <nav>
      <button type="button" onClick={() => setTab('summary')}>
        Summary
      </button>
      <button type="button" onClick={() => setTab('detail')}>
        Detail
      </button>
      <span>Showing {tab}</span>
    </nav>
  )
}
