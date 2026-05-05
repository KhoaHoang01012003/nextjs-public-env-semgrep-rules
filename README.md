# Next.js Public Env Exposure Semgrep Rules

Bộ rule này phát hiện secret/API key có nguy cơ bị bundle ra browser trong Next.js qua:

- `env` trong `next.config.js`, `next.config.ts`, `next.config.mjs`, `next.config.cjs`
- biến `.env*` có prefix `NEXT_PUBLIC_*`

## Cài và chạy

Trên Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip semgrep
```

Validate rule:

```powershell
.\.venv\Scripts\semgrep.exe --validate --config rules/nextjs-public-env-exposure.yaml
```

Chạy unit test rule:

```powershell
.\.venv\Scripts\semgrep.exe --test rules
```

Scan sample:

```powershell
.\.venv\Scripts\semgrep.exe --config rules/nextjs-public-env-exposure.yaml sample-next-app
```

Scan một project Next.js thật:

```powershell
.\.venv\Scripts\semgrep.exe --config rules/nextjs-public-env-exposure.yaml path\to\nextjs-project
```

## Đọc hướng dẫn cho dev

- Tiếng Việt: `docs/nextjs-public-env-rule-guide.md`
- English: `docs/nextjs-public-env-rule-guide.en.md`

## Rule IDs

- `nextjs-public-env.next-config-secret-key`
- `nextjs-public-env.next-config-spread-process-env`
- `nextjs-public-env.next-config-known-secret-value`
- `nextjs-public-env.next-config-process-env-secret-flow`
- `nextjs-public-env.next-config-process-env-alias`
- `nextjs-public-env.next-config-audit-any-env-entry`
- `nextjs-public-env.next-config-audit-public-env`
- `nextjs-public-env.dotenv-next-public-secret-name`
- `nextjs-public-env.dotenv-next-public-known-secret-value`
- `nextjs-public-env.dotenv-next-public-audit`
