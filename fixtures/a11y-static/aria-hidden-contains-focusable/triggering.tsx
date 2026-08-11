export function Banner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div aria-hidden="true" className="banner">
      <p>We use cookies.</p>
      {/* Still in the tab order, but silent to a screen reader. */}
      <button type="button" onClick={onDismiss}>
        Dismiss
      </button>
      <a href="/privacy">Privacy policy</a>
    </div>
  )
}
