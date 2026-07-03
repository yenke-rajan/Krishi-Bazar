---
name: Zod null vs undefined in optional fields
description: API validation rejects null for optional string fields — must omit the key entirely.
---

## Rule
`zod.string().optional()` in generated schemas accepts `string | undefined` but NOT `null`. Sending `{ image_url: null }` causes a 400 validation error.

**Why:** Zod treats null and undefined as distinct types. The OpenAPI codegen generates `.optional()` (not `.nullish()`), so null is rejected.

**How to apply:** When sending form data with optional file/string fields that may be absent, use spread to conditionally include the key:
```ts
body: JSON.stringify({ ...form, ...(image_url !== null ? { image_url } : {}) })
```
This applies to `image_url` in the catalog POST (`/api/catalog`) and any other optional string fields in generated Zod schemas.
