export function EmailField({ error }: { error?: string }) {
  return (
    <div>
      <label htmlFor="email">Email address</label>
      <input
        type="email"
        id="email"
        name="email"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'email-error' : undefined}
      />
      {error ? (
        <p className="error" id="email-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function PostcodeField() {
  return (
    <div>
      <label htmlFor="postcode">Postcode</label>
      {/* Valid: aria-invalid false is the normal state. */}
      <input type="text" id="postcode" name="postcode" aria-invalid={false} />
    </div>
  )
}
