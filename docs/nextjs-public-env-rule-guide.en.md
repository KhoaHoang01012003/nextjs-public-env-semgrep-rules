# Handling Semgrep Findings for Next.js Public Environment Exposure

## Purpose

This document explains how to interpret and remediate findings from the `nextjs-public-env` Semgrep ruleset, defined in `rules/nextjs-public-env-exposure.yaml`.

The ruleset is designed to help engineering, security, DevSecOps, and code review teams identify configuration patterns that can expose secrets, API keys, or server-side environment variables to client-side JavaScript bundles in Next.js applications.

## Executive Summary

In Next.js, some environment variables and configuration values are not server-only by default. Certain values can be embedded into the JavaScript bundle delivered to browsers.

Two patterns require strict control:

```js
// next.config.js
module.exports = {
  env: {
    API_SECRET: "abc123",
  },
};
```

```env
NEXT_PUBLIC_API_SECRET=abc123
```

Primary risks:

- Values under `env` in `next.config.*` can be bundled into client-side JavaScript.
- Variables in `.env*` with the `NEXT_PUBLIC_` prefix are treated as public by Next.js.
- Any secret that reaches a browser bundle should be treated as exposed.
- Minification, obfuscation, or variable renaming does not protect secrets.

Control principles:

- Do not place secrets under `next.config.* env`.
- Do not prefix secrets with `NEXT_PUBLIC_`.
- Do not use `env: process.env` or `env: { ...process.env }`.
- Only expose values that are explicitly confirmed to be safe for end users to view.

## Scope

The ruleset focuses on files commonly used in Next.js projects:

```txt
next.config.js
next.config.cjs
next.config.mjs
next.config.ts
.env
.env.*
```

The ruleset checks for:

- Secret-like keys under `next.config.* env`.
- Secret-like values under `next.config.* env`.
- Full `process.env` exposure through `env`.
- Aliases of `process.env` assigned to `env`.
- Data flow from `process.env.SECRET_LIKE_NAME` into `next.config.* env`.
- `.env*` variables with `NEXT_PUBLIC_` and secret-like names or values.
- Audit findings for all entries under `next.config.* env`.
- Audit findings for all remaining `NEXT_PUBLIC_*` variables.

## Severity Model

### ERROR

`ERROR` indicates a high-confidence risk that a secret or sensitive value may be exposed to a client-side bundle.

Findings with `ERROR` severity should be remediated before merge or deployment. If the value has already been committed, built, or deployed, credential rotation or revocation should be evaluated.

Examples:

```env
NEXT_PUBLIC_JWT_SECRET=abc123
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_GITHUB_TOKEN=ghp_xxx
```

```js
module.exports = {
  env: {
    ...process.env,
  },
};
```

### WARNING

`WARNING` indicates that a value may be public in browser JavaScript, but the rule does not have enough business context to determine whether the value is sensitive.

Findings with `WARNING` severity should be reviewed. The value may remain if it has been confirmed as public-safe.

Examples:

```env
NEXT_PUBLIC_APP_URL=https://example.com
NEXT_PUBLIC_FEATURE_FLAG=enabled
```

```js
module.exports = {
  env: {
    APP_ENV: process.env.APP_ENV,
    BUILD_NUMBER: process.env.BUILD_NUMBER,
  },
};
```

## Public Configuration vs. Secrets

### Public Configuration

Public configuration is data that can appear in browser JavaScript without granting privileged access, exposing credentials, or creating operational impact if copied.

Common examples:

```env
NEXT_PUBLIC_APP_URL=https://example.com
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXX
NEXT_PUBLIC_FEATURE_FLAG=enabled
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Secrets

Secrets are values used for authentication, authorization, signing, database access, API access, or proof of ownership.

Values that must not be public:

```env
DB_PASSWORD=...
JWT_SECRET=...
GITHUB_TOKEN=ghp_xxx
STRIPE_SECRET_KEY=sk_live_xxx
AWS_SECRET_ACCESS_KEY=...
PRIVATE_KEY=...
WEBHOOK_SECRET=...
```

Operational classification guideline: if exposure of a value would require rotation, revocation, password reset, or incident response, the value should be treated as a secret.

## Rule Inventory

| Rule ID | Severity | Purpose |
| --- | --- | --- |
| `nextjs-public-env.next-config-secret-key` | ERROR | Detects secret-like key names under `next.config.* env`. |
| `nextjs-public-env.next-config-known-secret-value` | ERROR | Detects values that match known secret formats under `next.config.* env`. |
| `nextjs-public-env.next-config-spread-process-env` | ERROR | Detects `process.env` or `...process.env` assigned to `env`. |
| `nextjs-public-env.next-config-process-env-secret-flow` | ERROR | Detects data flow from `process.env.SECRET_LIKE_NAME` into `env`. |
| `nextjs-public-env.next-config-process-env-alias` | ERROR | Detects aliases of `process.env` assigned to `env`. |
| `nextjs-public-env.next-config-audit-any-env-entry` | WARNING | Audits every entry under `next.config.* env`. |
| `nextjs-public-env.next-config-audit-public-env` | WARNING | Audits values that appear public-safe under `next.config.* env`. |
| `nextjs-public-env.dotenv-next-public-secret-name` | ERROR | Detects `NEXT_PUBLIC_*` variables with secret-like names in `.env*`. |
| `nextjs-public-env.dotenv-next-public-known-secret-value` | ERROR | Detects `NEXT_PUBLIC_*` variables with known secret-like values in `.env*`. |
| `nextjs-public-env.dotenv-next-public-audit` | WARNING | Audits remaining `NEXT_PUBLIC_*` variables. |

## Rule Details

### Secret-like Keys in `next.config.* env`

Related rule:

```txt
nextjs-public-env.next-config-secret-key
```

Example finding:

```js
module.exports = {
  env: {
    API_SECRET: "abc123",
    DATABASE_PASSWORD: "password",
    JWT_SECRET: "secret",
  },
};
```

Reason:

- Names containing `SECRET`, `TOKEN`, `PASSWORD`, `JWT`, `PRIVATE`, `DATABASE`, or `API_KEY` often represent sensitive data.
- `env` in `next.config.*` should not be treated as server-only.
- These values may be embedded in client-side JavaScript.

Recommended remediation:

```env
API_SECRET=abc123
JWT_SECRET=secret
```

The values should only be read from server-side code, such as API routes, route handlers, server actions, server-side middleware, or backend services.

### Known Secret-like Values in `next.config.* env`

Related rule:

```txt
nextjs-public-env.next-config-known-secret-value
```

Example finding:

```js
module.exports = {
  env: {
    STRIPE_BROWSER_KEY: "sk_live_FAKE",
  },
};
```

Reason:

- Some credentials have recognizable formats, such as `sk_live_`, `ghp_`, `github_pat_`, `glpat-`, `xoxb-`, or `AKIA...`.
- A variable name may look harmless while the value still represents a credential.

Recommended remediation:

```env
STRIPE_SECRET_KEY=sk_live_xxx
```

Credentials should only be consumed by server-side code. If a credential has already been deployed, rotation should be evaluated.

### Full `process.env` Exposure

Related rule:

```txt
nextjs-public-env.next-config-spread-process-env
```

Example findings:

```js
module.exports = {
  env: {
    ...process.env,
  },
};
```

```js
module.exports = {
  env: process.env,
};
```

Reason:

- `process.env` commonly contains server-only secrets.
- Assigning the full object can expose many secrets at once.
- This pattern has a large blast radius and should be removed.

Recommended remediation:

Expose only explicitly reviewed public values:

```js
module.exports = {
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};
```

In many cases, a `NEXT_PUBLIC_*` value can be placed in `.env*` directly and does not need to be repeated in `next.config.*`.

### Secret Flow Through Intermediate Variables

Related rule:

```txt
nextjs-public-env.next-config-process-env-secret-flow
```

Example finding:

```ts
const leakedFromServer = process.env.STRIPE_SECRET_KEY;

export default {
  env: {
    PUBLIC_CONFIG_VALUE: leakedFromServer,
  },
};
```

Reason:

- The secret is not directly inline inside the `env` object.
- The value still flows from `process.env.STRIPE_SECRET_KEY` into `next.config.* env`.
- This pattern is easy to miss with plain text search.

Recommended remediation:

Keep secret values in server-side code only and do not pass them into `next.config.* env`.

### Aliases of `process.env`

Related rule:

```txt
nextjs-public-env.next-config-process-env-alias
```

Example finding:

```js
const allServerEnv = process.env;

module.exports = {
  env: allServerEnv,
};
```

Reason:

- The alias still represents the full `process.env` object.
- The risk is equivalent to `env: process.env`.

Recommended remediation:

Do not assign a full `process.env` alias to `env`. Replace it with a reviewed list of public-safe values.

### Audit Every Entry in `next.config.* env`

Related rule:

```txt
nextjs-public-env.next-config-audit-any-env-entry
```

Example finding:

```ts
const nextConfig = {
  env: {
    DIRECTUS_PUBLIC_TOKEN: process.env.DIRECTUS_PUBLIC_TOKEN,
    DIRECTUS_FORM_TOKEN: process.env.DIRECTUS_FORM_TOKEN,
    CACHE_REVALIDATE_SECRET: process.env.CACHE_REVALIDATE_SECRET,
    APP_ENV: process.env.APP_ENV,
    BUILD_NUMBER: process.env.BUILD_NUMBER,
  },
};

export default nextConfig;
```

Reason:

- A conservative control posture minimizes use of `env` in `next.config.*`.
- Even values such as `APP_ENV` and `BUILD_NUMBER` can become public in the client bundle.
- This rule provides full visibility into public exposure surface area.

Recommended remediation:

- Remove values that do not need to be available in browser JavaScript.
- Move secrets to server-only environment variables.
- Keep public-safe values only after review.

### Public-looking Values in `next.config.* env`

Related rule:

```txt
nextjs-public-env.next-config-audit-public-env
```

Example finding:

```js
module.exports = {
  env: {
    NEXT_PUBLIC_APP_URL: "https://example.com",
  },
};
```

Reason:

- The value may be public-safe, but it is still exposed through `next.config.* env`.
- Review is required to confirm that browser exposure is intended.

Recommended remediation:

- Keep the value if it is public-safe.
- Move the value server-side if it is sensitive.
- Document the rationale if the finding is suppressed.

### Secret-like Names in `NEXT_PUBLIC_*`

Related rule:

```txt
nextjs-public-env.dotenv-next-public-secret-name
```

Example finding:

```env
NEXT_PUBLIC_JWT_SECRET=abc123
NEXT_PUBLIC_DB_PASSWORD=password
NEXT_PUBLIC_GITHUB_TOKEN=ghp_xxx
```

Reason:

- Next.js treats `NEXT_PUBLIC_*` variables as public.
- Names containing `SECRET`, `TOKEN`, `PASSWORD`, `JWT`, or `DATABASE` are typically not appropriate for browser exposure.

Recommended remediation:

```env
JWT_SECRET=abc123
DB_PASSWORD=password
GITHUB_TOKEN=ghp_xxx
```

These variables should only be read by server-side code.

### Secret-like Values in `NEXT_PUBLIC_*`

Related rule:

```txt
nextjs-public-env.dotenv-next-public-known-secret-value
```

Example finding:

```env
NEXT_PUBLIC_STRIPE_BROWSER_KEY=sk_live_xxx
NEXT_PUBLIC_GITHUB_VALUE=ghp_xxx
```

Reason:

- The variable name may not clearly identify the risk.
- The value format may indicate that it is a real credential.

Recommended remediation:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
```

Client-side code should use the publishable key. Server-side code should use the secret key.

### Audit `NEXT_PUBLIC_*`

Related rule:

```txt
nextjs-public-env.dotenv-next-public-audit
```

Example finding:

```env
NEXT_PUBLIC_APP_URL=https://example.com
NEXT_PUBLIC_FEATURE_FLAG=enabled
```

Reason:

- `NEXT_PUBLIC_*` is public by design in Next.js.
- Many values are legitimate, but each value should be reviewed to prevent accidental secret exposure.

Recommended remediation:

- Keep the value if it is public-safe.
- Move it to a server-only environment variable if browser exposure is not required.

## Remediation Workflow

### ERROR Findings

Recommended process:

1. Identify the flagged value.
2. Classify the value as a secret, public configuration, or operational metadata.
3. If the value is a secret, remove it from `next.config.* env` or `NEXT_PUBLIC_*`.
4. Move the secret to a server-only environment variable without the `NEXT_PUBLIC_` prefix.
5. Ensure the secret is only read by server-side code.
6. If the value has been committed, built, or deployed, evaluate credential rotation or revocation.
7. Re-run Semgrep to confirm remediation.

Suppressing `ERROR` findings should require a clear technical rationale and an approved exception.

### WARNING Findings

Recommended process:

1. Confirm whether the value needs to be available in browser JavaScript.
2. Confirm whether the value is public-safe.
3. Remove the value from `next.config.* env` if it does not need browser exposure.
4. Keep the value if it is public-safe and has a valid use case.
5. If the finding is suppressed, include a clear justification.

Suppression example in JavaScript:

```js
// nosemgrep: nextjs-public-env.next-config-audit-any-env-entry
// Public app URL, no credential or privileged access.
module.exports = {
  env: {
    NEXT_PUBLIC_APP_URL: "https://example.com",
  },
};
```

Suppression example in `.env`:

```env
# nosemgrep: nextjs-public-env.dotenv-next-public-audit
# Public app URL, no credential or privileged access.
NEXT_PUBLIC_APP_URL=https://example.com
```

Exceptions should not be used only to make a pipeline pass. Each exception should have a verifiable technical or business rationale.

## Common Architecture Fixes

### Client-side code needs to call a third-party API with a secret

Non-compliant:

```env
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_xxx
```

```ts
await fetch("https://api.stripe.com/v1/...", {
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY}`,
  },
});
```

Compliant:

```env
STRIPE_SECRET_KEY=sk_live_xxx
```

Client-side code calls an internal API:

```ts
await fetch("/api/payments/create-checkout-session", {
  method: "POST",
});
```

Server-side code calls the third-party service:

```ts
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
```

Recommended flow:

```txt
Browser -> API route / Server Action -> Third-party API
```

### Public, non-sensitive configuration is required

Acceptable example:

```env
NEXT_PUBLIC_APP_URL=https://example.com
```

Review criteria:

- The value does not contain credentials.
- The value does not grant privileged access.
- Copying the value does not create data, financial, or operational risk.

### `env: { ...process.env }` is currently used

Non-compliant:

```js
module.exports = {
  env: {
    ...process.env,
  },
};
```

Improved:

```js
module.exports = {
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};
```

Preferred:

```env
NEXT_PUBLIC_APP_URL=https://example.com
```

Then remove the `env` block from `next.config.*` if it is no longer required.

## Provider-specific Examples

### Stripe

May be public:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

Must not be public:

```env
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_xxx
```

### Firebase

Some Firebase configuration is designed for browser use, but project rules, permissions, domain restrictions, and security posture still require review.

Requires review:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
```

### Sentry

Frontend Sentry DSNs are often public-safe, but project-specific configuration should still be reviewed.

Potentially public-safe depending on context:

```env
NEXT_PUBLIC_SENTRY_DSN=...
```

### GitHub Tokens

Must not be public:

```env
NEXT_PUBLIC_GITHUB_TOKEN=ghp_xxx
```

Depending on scope, such tokens may allow repository read access, issue creation, release management, or other privileged operations.

## Limitations

This ruleset reduces the risk of unsafe environment exposure, but it does not replace code review or dedicated secret scanning.

Known limitations:

- Highly dynamic JavaScript or TypeScript may be missed.
- Cross-file data flow may not be fully analyzed in Semgrep Community.
- Secrets with unusual names and non-recognizable values may not be flagged as `ERROR`.
- Some legitimate public configuration may still produce `WARNING` findings.
- The ruleset does not have application-specific business context.

Operational recommendations:

- Block `ERROR` findings in CI/CD.
- Treat `WARNING` findings as review or audit signals.
- Combine this ruleset with repository secret scanning.
- Rotate or revoke credentials when exposure is suspected.

## Running the Rules

Validate the rules:

```powershell
.\.venv\Scripts\semgrep.exe --validate --config rules/nextjs-public-env-exposure.yaml
```

Run rule tests:

```powershell
.\.venv\Scripts\semgrep.exe --test rules
```

Scan the sample project:

```powershell
.\.venv\Scripts\semgrep.exe --config rules/nextjs-public-env-exposure.yaml sample-next-app
```

Scan a Next.js project:

```powershell
.\.venv\Scripts\semgrep.exe --config rules/nextjs-public-env-exposure.yaml path\to\nextjs-project
```

## Merge Review Checklist

Recommended reviewer checklist:

- Has a new `NEXT_PUBLIC_*` variable been added?
- Has each `NEXT_PUBLIC_*` variable been confirmed as public-safe?
- Is any secret present under `next.config.* env`?
- Is `...process.env` or `env: process.env` used?
- Is an alias of `process.env` assigned to `env`?
- Does any entry under `next.config.* env` not require browser exposure?
- Have all `ERROR` findings been remediated or approved as exceptions?
- Have all `WARNING` findings been reviewed?
- If `nosemgrep` is used, is the suppression rationale clear and verifiable?

## References

- Next.js `next.config.js env`: https://nextjs.org/docs/pages/api-reference/config/next-config-js/env
- Next.js environment variables: https://nextjs.org/docs/pages/guides/environment-variables
- Semgrep taint mode: https://semgrep.dev/docs/writing-rules/data-flow/taint-mode/overview
- Semgrep testing rules: https://semgrep.dev/docs/writing-rules/testing-rules
