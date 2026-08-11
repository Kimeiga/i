export function CheckoutFields() {
  return (
    <form>
      <label htmlFor="card">Card number</label>
      <input type="text" id="card" tabIndex={3} />

      <label htmlFor="expiry">Expiry</label>
      <input type="text" id="expiry" tabIndex={1} />

      <div role="button" tabIndex={2}>
        Use a saved card
      </div>
    </form>
  )
}
