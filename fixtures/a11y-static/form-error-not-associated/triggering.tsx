export function EmailField({ error }: { error?: string }) {
  return (
    <div>
      <label htmlFor="email">Email address</label>
      {/* Marked invalid, but nothing points at the message below. */}
      <input type="email" id="email" name="email" aria-invalid={true} />
      {error ? <p className="error">{error}</p> : null}
    </div>
  )
}

export function PostcodeField() {
  return (
    <div>
      <label htmlFor="postcode">Postcode</label>
      <input type="text" id="postcode" name="postcode" aria-invalid="true" />
      <span className="error">That postcode is not recognised.</span>
    </div>
  )
}
