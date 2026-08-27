export function SubscribeForm() {
  return (
    <form>
      {/* No id, no aria-label, not wrapped in a label: nothing can name it. */}
      <input type="text" name="email" placeholder="Email address" />
      <textarea name="notes" rows={4} />
      <button type="submit">Subscribe</button>
    </form>
  )
}
