## Why it matters

`NEXT_PUBLIC_` is not access control. It is a build-time string substitution that puts the value in
a JavaScript file anyone can open. A secret published this way is disclosed to every visitor who has
ever loaded the page, including ones from before you noticed, and rotating it is the only remedy.

The prefix is usually added in the ten seconds after discovering that a value is `undefined` in the
browser, which is the moment least likely to include the question "should this be public?".

## How to fix it

Rename the variable without the prefix and read it on the server only. Pass whatever the browser
genuinely needs — usually a much narrower derived value — down as a prop.

Then rotate the secret. It has been in a public bundle and in the build cache of everyone who has
run the build.

## What this rule will not catch

The name list is deliberately short and matches only words with no benign public meaning: SECRET,
PASSWORD, SERVICE_ROLE and a few others. `NEXT_PUBLIC_API_KEY` is not reported, because most of
those are Google Maps keys and Stripe publishable keys that are supposed to be public, and a rule
that fires on correct code in most repositories is a rule people turn off. A badly named secret gets
through. This checks names, never values.
