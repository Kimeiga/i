export function SubscribeForm({ inputProps }: { inputProps: Record<string, unknown> }) {
  return (
    <form>
      {/* Associated by id. */}
      <label htmlFor="email">Email address</label>
      <input type="text" id="email" name="email" />

      {/* Associated by wrapping. */}
      <label>
        Notes
        <textarea name="notes" rows={4} />
      </label>

      {/* Named directly. */}
      <input type="search" aria-label="Search orders" name="q" />

      {/* Spread props may carry a name; we cannot prove otherwise. */}
      <input type="text" {...inputProps} />

      {/* Labelled by its own value. */}
      <input type="submit" value="Subscribe" />
    </form>
  )
}
