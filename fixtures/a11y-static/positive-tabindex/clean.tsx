export function CheckoutFields({ onSaved }: { onSaved: () => void }) {
  return (
    <form>
      {/* Source order is the tab order. */}
      <label htmlFor="expiry">Expiry</label>
      <input type="text" id="expiry" />

      <label htmlFor="card">Card number</label>
      <input type="text" id="card" tabIndex={0} />

      {/* Focusable by script only, never by tabbing. */}
      <div tabIndex={-1} id="status" role="status" />

      <button type="button" onClick={onSaved}>
        Use a saved card
      </button>
    </form>
  )
}
