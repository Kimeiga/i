function TrashIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" />
}

export function RowActions({ onDelete }: { onDelete: () => void }) {
  return (
    <div>
      {/* Named by aria-label; the icon is hidden so it is not announced twice. */}
      <button type="button" aria-label="Delete row" onClick={onDelete}>
        <TrashIcon aria-hidden="true" />
      </button>

      {/* Named by its own visible text. */}
      <button type="button" onClick={onDelete}>
        <TrashIcon aria-hidden="true" />
        Delete
      </button>

      <a href="/settings">Settings</a>

      {/* An anchor with no href is text, not a control. */}
      <a>
        <TrashIcon />
      </a>
    </div>
  )
}
