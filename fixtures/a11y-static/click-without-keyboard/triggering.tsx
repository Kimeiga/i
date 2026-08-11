export function OrderRow({ onOpen, onDelete }: { onOpen: () => void; onDelete: () => void }) {
  return (
    <li>
      {/* No focus, no Enter, no Space. */}
      <div className="row" onClick={onOpen}>
        Order 1042
      </div>

      {/* Half-finished: exposed as a button, still not keyboard operable. */}
      <span role="button" tabIndex={0} onClick={onDelete}>
        Delete
      </span>
    </li>
  )
}
