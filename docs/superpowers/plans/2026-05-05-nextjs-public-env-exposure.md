# Next.js Public Env Exposure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build standalone Semgrep rules and tests that detect secrets exposed through Next.js public bundling behavior.

**Architecture:** Use JavaScript/TypeScript AST rules for `next.config.*`, Semgrep taint mode for simple `process.env` flows into `env`, and generic regex rules for `.env*` files containing `NEXT_PUBLIC_*`. Split findings into high-confidence `ERROR` detections and lower-noise `WARNING` audit detections.

**Tech Stack:** Semgrep YAML rules, Semgrep test fixtures, JavaScript/TypeScript test samples, generic `.env` test samples, Markdown developer guide.

---

### Task 1: Rule Test Fixtures

**Files:**
- Create: `rules/nextjs-public-env-exposure.js`
- Create: `rules/nextjs-public-env-exposure.ts`
- Create: `rules/nextjs-public-env-exposure.generic`

- [ ] **Step 1: Write failing tests for Next config JavaScript**

Create tests for secret-like keys, spread of `process.env`, direct `env: process.env`, safe literal audit values, and safe non-config examples.

- [ ] **Step 2: Write failing tests for Next config TypeScript**

Create tests for export-default config, aliasing `process.env`, and simple taint flow from `process.env.SECRET` into `env`.

- [ ] **Step 3: Write failing tests for `.env*` generic mode**

Create tests for `NEXT_PUBLIC_*` secret names, known secret values, and public-safe audit values.

- [ ] **Step 4: Run RED**

Run: `semgrep --test rules`

Expected: FAIL because `rules/nextjs-public-env-exposure.yaml` has not been implemented yet.

### Task 2: Semgrep Rule YAML

**Files:**
- Create: `rules/nextjs-public-env-exposure.yaml`

- [ ] **Step 1: Implement AST rules for `next.config.*`**

Add high-confidence rules for secret-like keys and spreading/passing `process.env`.

- [ ] **Step 2: Implement taint rule for `process.env` flows**

Add a taint rule with `process.env.SECRET` sources and Next config `env` sinks.

- [ ] **Step 3: Implement audit AST rule**

Add a warning rule for public-safe-looking literal values configured under `env`.

- [ ] **Step 4: Implement generic `.env*` rules**

Add high-confidence rules for secret-like `NEXT_PUBLIC_*` names and known secret value formats, plus a warning audit rule for public-safe-looking values.

- [ ] **Step 5: Validate YAML**

Run: `semgrep --validate --config rules/nextjs-public-env-exposure.yaml`

Expected: validation succeeds.

- [ ] **Step 6: Run GREEN**

Run: `semgrep --test rules`

Expected: all tests pass.

### Task 3: Sample Project and Developer Guide

**Files:**
- Create: `sample-next-app/next.config.js`
- Create: `sample-next-app/.env.local`
- Create: `docs/nextjs-public-env-rule-guide.md`
- Create: `README.md`

- [ ] **Step 1: Create sample scan targets**

Add a small Next.js-like fixture with intentional findings.

- [ ] **Step 2: Write Vietnamese developer guide**

Explain what the rule detects, why Next.js exposes these values, what is safe, what is dangerous, and how to fix findings.

- [ ] **Step 3: Add README quick start**

Document install, validate, test, and scan commands.

- [ ] **Step 4: Run sample scan**

Run: `semgrep --config rules/nextjs-public-env-exposure.yaml sample-next-app`

Expected: findings are reported for intentional exposures.

### Task 4: Final Verification

**Files:**
- Review all created files.

- [ ] **Step 1: Run validation**

Run: `semgrep --validate --config rules/nextjs-public-env-exposure.yaml`

Expected: validation succeeds.

- [ ] **Step 2: Run tests**

Run: `semgrep --test rules`

Expected: all tests pass.

- [ ] **Step 3: Run sample scan**

Run: `semgrep --config rules/nextjs-public-env-exposure.yaml sample-next-app`

Expected: intentional findings are reported.
