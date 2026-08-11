import { TabSwitcher } from './TabSwitcher'

// The page stays on the server. Only the one interactive component below it is
// a client component.
export default async function ReportsPage() {
  const reports = await fetch('https://api.example.com/reports').then((r) => r.json())

  return (
    <main>
      <h1>Reports</h1>
      <TabSwitcher />
      <ul>
        {reports.map((report: { id: string; title: string }) => (
          <li key={report.id}>{report.title}</li>
        ))}
      </ul>
    </main>
  )
}
