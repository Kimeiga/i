'use client'

import { useState } from 'react'

// The directive is on the page, so every component this renders ships to the
// browser — including the parts that only display server data.
export default function DashboardPage() {
  const [tab, setTab] = useState('overview')

  return (
    <main>
      <h1>Dashboard</h1>
      <nav>
        <button type="button" onClick={() => setTab('overview')}>
          Overview
        </button>
        <button type="button" onClick={() => setTab('billing')}>
          Billing
        </button>
      </nav>
      <p>Showing {tab}</p>
    </main>
  )
}
