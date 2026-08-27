## Why it matters

Every prop passed from a server component to a client component is serialised into the HTML
document, in full, visible in view-source. Passing `user` when the component renders `user.name`
publishes the email, the password hash, the internal risk score, and whatever the next migration
adds to that table.

The last part is what makes it worth a rule: the code does not change when the leak gets worse. A
column added six months later is published by a line nobody edited.

## How to fix it

Pass the fields the component renders, or map the record to a view model on the server:

```tsx
const user = await prisma.user.findUnique({ where: { id } })
return <UserCard name={user.name} avatarUrl={user.avatarUrl} />
```

A `toClientUser()` function next to the query is worth writing once per record type. It also gives
you a single place to look when someone asks what leaves the server.

## What this rule will not catch

This rule is **experimental and off by default**, and it should stay that way until you have looked
at what it says about your codebase. Recognising "this identifier holds a database record" from
syntax alone is a heuristic keyed on the shape of the query call — `findUnique`, `findMany`,
`select`. A data layer that does not look like those escapes it entirely, and a helper of yours that
happens to be named `select` will trip it. It also only sees identifiers passed directly, so
`<UserCard user={{ ...user }} />` is missed.

Enable it with:

```json
{ "rules": { "privacy/over-serialized-client-props": "on" } }
```
