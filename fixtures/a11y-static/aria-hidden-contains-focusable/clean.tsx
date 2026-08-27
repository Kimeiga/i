export function Banner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="banner">
      {/* Decorative, and nothing inside it can be focused. */}
      <div aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" />
        <span>*</span>
      </div>

      <p>We use cookies.</p>
      <button type="button" onClick={onDismiss}>
        Dismiss
      </button>

      {/* Hidden and taken out of the tab order together. */}
      <div aria-hidden="true">
        <button type="button" tabIndex={-1}>
          Not reachable
        </button>
        <a>Not a link without href</a>
      </div>
    </div>
  )
}
