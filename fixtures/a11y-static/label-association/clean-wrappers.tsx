// Design-system wrappers. A capitalised name is a component, not a DOM element:
// it may set an id, forward a ref, or spread props we cannot see, and reporting
// it would accuse correct code of being broken.
//
// This fixture exists because a case-insensitive tag match reported 106 missing
// labels in one real repository, almost all of them on <Input> components that
// were labelled properly.

function Input(props: Record<string, unknown>) {
  return <input {...props} />
}

function Select(props: { children: React.ReactNode }) {
  return <select aria-label="Choose one">{props.children}</select>
}

export function AdminDialog({
  reason,
  setReason,
}: {
  reason: string
  setReason: (value: string) => void
}) {
  return (
    <form>
      <Input type="text" value={reason} onChange={(event) => setReason(event.target.value)} />
      <Select>
        <option>Duplicate</option>
        <option>Spam</option>
      </Select>
    </form>
  )
}
