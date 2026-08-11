export function OrderRow({
  onOpen,
  onDelete,
  rowProps,
}: {
  onOpen: () => void
  onDelete: () => void
  rowProps: Record<string, unknown>
}) {
  return (
    <li>
      {/* The element that was built for this. */}
      <button type="button" className="row" onClick={onOpen}>
        Order 1042
      </button>

      {/* Role, tab stop and key handling together. */}
      <div
        role="button"
        tabIndex={0}
        onClick={onDelete}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') onDelete()
        }}
      >
        Delete
      </div>

      <a href="/orders/1042" onClick={onOpen}>
        Open in a new page
      </a>

      {/* Spread props may add key handling. */}
      <div onClick={onOpen} {...rowProps} />
    </li>
  )
}
