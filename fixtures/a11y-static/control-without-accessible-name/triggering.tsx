function TrashIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" />
}

export function RowActions({ onDelete }: { onDelete: () => void }) {
  return (
    <div>
      <button type="button" onClick={onDelete}>
        <TrashIcon />
      </button>
      <a href="/settings">
        <svg width="16" height="16" viewBox="0 0 16 16" />
      </a>
    </div>
  )
}
