# Hướng dẫn xử lý cảnh báo Semgrep về lộ biến môi trường trong Next.js

## Mục đích

Tài liệu này mô tả cách hiểu và xử lý các cảnh báo từ bộ rule Semgrep `nextjs-public-env`, được định nghĩa tại `rules/nextjs-public-env-exposure.yaml`.

Bộ rule được xây dựng nhằm hỗ trợ đội ngũ phát triển phát hiện sớm các cấu hình có thể làm lộ secret, API key hoặc biến môi trường server-side vào JavaScript bundle phía client trong ứng dụng Next.js.

Tài liệu hướng đến các nhóm phát triển sản phẩm, reviewer kỹ thuật, DevSecOps và các bên liên quan trong quy trình kiểm soát chất lượng mã nguồn.

## Tóm tắt điều hành

Trong Next.js, một số biến môi trường và cấu hình không chỉ tồn tại ở server. Các giá trị này có thể được đưa vào JavaScript bundle và được gửi đến trình duyệt.

Hai cơ chế cần kiểm soát chặt chẽ:

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

Rủi ro chính:

- Giá trị trong `next.config.*` thuộc phần `env` có thể được bundle vào JavaScript phía client.
- Biến `.env*` có prefix `NEXT_PUBLIC_` được Next.js coi là biến public.
- Secret đã xuất hiện trong browser bundle cần được xem là đã bị lộ.
- Minify, obfuscate hoặc đổi tên biến không bảo vệ được secret.

Nguyên tắc kiểm soát:

- Không đưa secret vào `next.config.* env`.
- Không đặt secret dưới prefix `NEXT_PUBLIC_`.
- Không dùng `env: process.env` hoặc `env: { ...process.env }`.
- Chỉ public các giá trị đã được xác nhận là an toàn khi người dùng cuối nhìn thấy.

## Phạm vi kiểm tra

Bộ rule tập trung vào các file thường gặp trong dự án Next.js:

```txt
next.config.js
next.config.cjs
next.config.mjs
next.config.ts
.env
.env.*
```

Các nhóm vấn đề được kiểm tra:

- Secret-like key trong `next.config.* env`.
- Secret-like value trong `next.config.* env`.
- Toàn bộ `process.env` hoặc alias của `process.env` được đưa vào `env`.
- Luồng dữ liệu từ `process.env.SECRET_LIKE_NAME` vào `next.config.* env`.
- Biến `.env*` có prefix `NEXT_PUBLIC_` với tên hoặc giá trị giống secret.
- Audit toàn bộ entry trong `next.config.* env`.
- Audit toàn bộ biến `NEXT_PUBLIC_*`.

## Mức độ cảnh báo

### ERROR

`ERROR` thể hiện khả năng cao có secret hoặc dữ liệu nhạy cảm đang bị public ra client bundle.

Các cảnh báo `ERROR` cần được xử lý trước khi merge hoặc deploy. Nếu giá trị đã được commit, build hoặc deploy, cần đánh giá khả năng rotate/revoke credential.

Ví dụ:

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

`WARNING` thể hiện giá trị có thể bị public ra browser, nhưng chưa đủ dữ kiện để khẳng định là secret.

Các cảnh báo `WARNING` cần được review. Giá trị có thể được giữ lại nếu đã xác nhận là public-safe.

Ví dụ:

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

## Public config và secret

### Public config

Public config là giá trị có thể xuất hiện ở browser mà không tạo quyền truy cập đặc biệt, không cấp credential và không gây thiệt hại nếu bị sao chép.

Ví dụ thường có thể public:

```env
NEXT_PUBLIC_APP_URL=https://example.com
NEXT_PUBLIC_ANALYTICS_ID=G-XXXXXXX
NEXT_PUBLIC_FEATURE_FLAG=enabled
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

### Secret

Secret là giá trị dùng để xác thực, phân quyền, ký dữ liệu, truy cập API, truy cập cơ sở dữ liệu hoặc chứng minh quyền sở hữu.

Ví dụ không được public:

```env
DB_PASSWORD=...
JWT_SECRET=...
GITHUB_TOKEN=ghp_xxx
STRIPE_SECRET_KEY=sk_live_xxx
AWS_SECRET_ACCESS_KEY=...
PRIVATE_KEY=...
WEBHOOK_SECRET=...
```

Tiêu chí nhận diện thực tế: nếu việc lộ giá trị yêu cầu rotate, revoke, đổi mật khẩu hoặc mở incident, giá trị đó cần được xử lý như secret.

## Danh sách rule

| Rule ID | Mức độ | Mục đích |
| --- | --- | --- |
| `nextjs-public-env.next-config-secret-key` | ERROR | Phát hiện key có tên giống secret trong `next.config.* env`. |
| `nextjs-public-env.next-config-known-secret-value` | ERROR | Phát hiện value có format giống secret thật trong `next.config.* env`. |
| `nextjs-public-env.next-config-spread-process-env` | ERROR | Phát hiện `process.env` hoặc spread `...process.env` được đưa vào `env`. |
| `nextjs-public-env.next-config-process-env-secret-flow` | ERROR | Phát hiện dữ liệu từ `process.env.SECRET_LIKE_NAME` chảy vào `env`. |
| `nextjs-public-env.next-config-process-env-alias` | ERROR | Phát hiện alias của `process.env` được đưa vào `env`. |
| `nextjs-public-env.next-config-audit-any-env-entry` | WARNING | Audit mọi entry nằm trong `next.config.* env`. |
| `nextjs-public-env.next-config-audit-public-env` | WARNING | Audit giá trị có vẻ public-safe trong `next.config.* env`. |
| `nextjs-public-env.dotenv-next-public-secret-name` | ERROR | Phát hiện `NEXT_PUBLIC_*` có tên giống secret trong `.env*`. |
| `nextjs-public-env.dotenv-next-public-known-secret-value` | ERROR | Phát hiện `NEXT_PUBLIC_*` có value giống secret thật trong `.env*`. |
| `nextjs-public-env.dotenv-next-public-audit` | WARNING | Audit mọi biến `NEXT_PUBLIC_*` còn lại. |

## Giải thích chi tiết từng nhóm rule

### Secret-like key trong `next.config.* env`

Rule liên quan:

```txt
nextjs-public-env.next-config-secret-key
```

Ví dụ bị báo:

```js
module.exports = {
  env: {
    API_SECRET: "abc123",
    DATABASE_PASSWORD: "password",
    JWT_SECRET: "secret",
  },
};
```

Lý do cảnh báo:

- Các key chứa `SECRET`, `TOKEN`, `PASSWORD`, `JWT`, `PRIVATE`, `DATABASE`, `API_KEY` thường đại diện cho dữ liệu nhạy cảm.
- Phần `env` trong `next.config.*` không nên được xem là server-only.
- Các giá trị này có thể xuất hiện trong bundle phía client.

Hướng xử lý:

```env
API_SECRET=abc123
JWT_SECRET=secret
```

Các biến trên cần được đọc tại server-side code, ví dụ API route, route handler, server action, middleware server-side hoặc backend service.

### Secret-like value trong `next.config.* env`

Rule liên quan:

```txt
nextjs-public-env.next-config-known-secret-value
```

Ví dụ bị báo:

```js
module.exports = {
  env: {
    STRIPE_BROWSER_KEY: "sk_live_FAKE",
  },
};
```

Lý do cảnh báo:

- Một số secret có format đặc trưng như `sk_live_`, `ghp_`, `github_pat_`, `glpat-`, `xoxb-`, `AKIA...`.
- Tên biến có thể không chứa chữ `SECRET`, nhưng giá trị vẫn là credential.

Hướng xử lý:

```env
STRIPE_SECRET_KEY=sk_live_xxx
```

Credential chỉ nên được sử dụng ở server-side. Nếu credential đã được deploy, cần đánh giá rotate key.

### Đưa toàn bộ `process.env` vào `env`

Rule liên quan:

```txt
nextjs-public-env.next-config-spread-process-env
```

Ví dụ bị báo:

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

Lý do cảnh báo:

- `process.env` thường chứa nhiều biến server-only.
- Việc đưa toàn bộ `process.env` vào `env` có thể public nhiều secret cùng lúc.
- Đây là pattern có rủi ro cao và cần loại bỏ.

Hướng xử lý:

Không expose toàn bộ `process.env`. Chỉ khai báo các giá trị public thật sự cần thiết.

```js
module.exports = {
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};
```

Trong nhiều trường hợp, biến `NEXT_PUBLIC_*` có thể được đặt trực tiếp trong `.env*` và không cần khai báo lại trong `next.config.*`.

### Secret đi qua biến trung gian

Rule liên quan:

```txt
nextjs-public-env.next-config-process-env-secret-flow
```

Ví dụ bị báo:

```ts
const leakedFromServer = process.env.STRIPE_SECRET_KEY;

export default {
  env: {
    PUBLIC_CONFIG_VALUE: leakedFromServer,
  },
};
```

Lý do cảnh báo:

- Secret không xuất hiện inline trong object `env`.
- Dữ liệu vẫn đi từ `process.env.STRIPE_SECRET_KEY` vào `next.config.* env`.
- Pattern này dễ bị bỏ sót nếu chỉ kiểm tra bằng tìm kiếm text đơn giản.

Hướng xử lý:

Biến secret cần được giữ trong server-side code và không được đưa vào `next.config.* env`.

### Alias của `process.env`

Rule liên quan:

```txt
nextjs-public-env.next-config-process-env-alias
```

Ví dụ bị báo:

```js
const allServerEnv = process.env;

module.exports = {
  env: allServerEnv,
};
```

Lý do cảnh báo:

- Alias vẫn đại diện cho toàn bộ `process.env`.
- Rủi ro tương đương `env: process.env`.

Hướng xử lý:

Không alias toàn bộ `process.env` để đưa vào `env`. Cần thay bằng danh sách giá trị public được kiểm duyệt rõ ràng.

### Audit mọi entry trong `next.config.* env`

Rule liên quan:

```txt
nextjs-public-env.next-config-audit-any-env-entry
```

Ví dụ bị báo:

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

Lý do cảnh báo:

- Chính sách kiểm soát an toàn là giảm tối đa việc dùng `env` trong `next.config.*`.
- Kể cả `APP_ENV` hoặc `BUILD_NUMBER` không phải secret, các giá trị này vẫn có thể được public ra client.
- Rule này hỗ trợ review toàn bộ bề mặt public exposure.

Hướng xử lý:

- Biến không cần thiết ở browser cần được loại bỏ khỏi `next.config.* env`.
- Secret cần được chuyển sang server-only env.
- Giá trị public-safe có thể được giữ lại sau khi review.

### Audit giá trị public trong `next.config.* env`

Rule liên quan:

```txt
nextjs-public-env.next-config-audit-public-env
```

Ví dụ bị báo:

```js
module.exports = {
  env: {
    NEXT_PUBLIC_APP_URL: "https://example.com",
  },
};
```

Lý do cảnh báo:

- Giá trị có vẻ public-safe nhưng vẫn đang được public qua `next.config.* env`.
- Cần xác nhận giá trị này có thật sự an toàn khi xuất hiện ở browser.

Hướng xử lý:

- Giữ lại nếu giá trị public-safe.
- Chuyển sang server-only env nếu có dữ liệu nhạy cảm.
- Ghi chú rõ lý do nếu cần ignore cảnh báo.

### Secret-like name trong `NEXT_PUBLIC_*`

Rule liên quan:

```txt
nextjs-public-env.dotenv-next-public-secret-name
```

Ví dụ bị báo:

```env
NEXT_PUBLIC_JWT_SECRET=abc123
NEXT_PUBLIC_DB_PASSWORD=password
NEXT_PUBLIC_GITHUB_TOKEN=ghp_xxx
```

Lý do cảnh báo:

- Prefix `NEXT_PUBLIC_` được Next.js dùng để public biến ra browser.
- Tên biến chứa `SECRET`, `TOKEN`, `PASSWORD`, `JWT`, `DATABASE` thường không phù hợp để public.

Hướng xử lý:

```env
JWT_SECRET=abc123
DB_PASSWORD=password
GITHUB_TOKEN=ghp_xxx
```

Các biến này chỉ nên được đọc ở server-side code.

### Secret-like value trong `NEXT_PUBLIC_*`

Rule liên quan:

```txt
nextjs-public-env.dotenv-next-public-known-secret-value
```

Ví dụ bị báo:

```env
NEXT_PUBLIC_STRIPE_BROWSER_KEY=sk_live_xxx
NEXT_PUBLIC_GITHUB_VALUE=ghp_xxx
```

Lý do cảnh báo:

- Tên biến có thể không thể hiện rõ rủi ro.
- Format value cho thấy đây có thể là credential thật.

Hướng xử lý:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
```

Frontend chỉ sử dụng publishable key. Secret key chỉ được sử dụng ở server.

### Audit biến `NEXT_PUBLIC_*`

Rule liên quan:

```txt
nextjs-public-env.dotenv-next-public-audit
```

Ví dụ bị báo:

```env
NEXT_PUBLIC_APP_URL=https://example.com
NEXT_PUBLIC_FEATURE_FLAG=enabled
```

Lý do cảnh báo:

- `NEXT_PUBLIC_*` là public theo thiết kế của Next.js.
- Giá trị có thể hợp lệ, nhưng vẫn cần review để tránh cấu hình nhầm secret.

Hướng xử lý:

- Giữ lại nếu giá trị public-safe.
- Chuyển sang server-only env nếu không cần xuất hiện ở browser.

## Quy trình xử lý cảnh báo

### Đối với cảnh báo ERROR

Các bước xử lý đề xuất:

1. Xác định giá trị bị cảnh báo.
2. Phân loại giá trị là secret, public config hay giá trị vận hành.
3. Nếu là secret, loại bỏ khỏi `next.config.* env` hoặc `NEXT_PUBLIC_*`.
4. Chuyển secret sang biến server-only, không dùng prefix `NEXT_PUBLIC_`.
5. Đảm bảo secret chỉ được đọc tại server-side code.
6. Nếu giá trị đã được commit, build hoặc deploy, đánh giá rotate/revoke credential.
7. Chạy lại Semgrep để xác nhận.

Không nên ignore `ERROR` nếu không có phê duyệt và lý do rõ ràng.

### Đối với cảnh báo WARNING

Các bước xử lý đề xuất:

1. Xác nhận giá trị có cần xuất hiện ở browser hay không.
2. Xác nhận giá trị có public-safe hay không.
3. Loại bỏ khỏi `next.config.* env` nếu không cần public.
4. Giữ lại nếu giá trị public-safe và có lý do hợp lệ.
5. Nếu ignore cảnh báo, comment cần nêu rõ lý do.

Ví dụ ignore trong JavaScript:

```js
// nosemgrep: nextjs-public-env.next-config-audit-any-env-entry
// Public app URL, no credential or privileged access.
module.exports = {
  env: {
    NEXT_PUBLIC_APP_URL: "https://example.com",
  },
};
```

Ví dụ ignore trong `.env`:

```env
# nosemgrep: nextjs-public-env.dotenv-next-public-audit
# Public app URL, no credential or privileged access.
NEXT_PUBLIC_APP_URL=https://example.com
```

Exception không nên được dùng chỉ để làm pipeline xanh. Mỗi exception cần có căn cứ kỹ thuật hoặc nghiệp vụ rõ ràng.

## Hướng dẫn sửa kiến trúc phổ biến

### Trường hợp frontend cần gọi API bên thứ ba bằng secret

Không phù hợp:

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

Phù hợp:

```env
STRIPE_SECRET_KEY=sk_live_xxx
```

Frontend gọi API nội bộ:

```ts
await fetch("/api/payments/create-checkout-session", {
  method: "POST",
});
```

Server-side code gọi dịch vụ bên thứ ba:

```ts
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
```

Luồng xử lý đề xuất:

```txt
Browser -> API route / Server Action -> Third-party API
```

### Trường hợp cần public cấu hình không nhạy cảm

Ví dụ có thể chấp nhận:

```env
NEXT_PUBLIC_APP_URL=https://example.com
```

Tiêu chí review:

- Giá trị không chứa credential.
- Giá trị không cấp quyền truy cập đặc biệt.
- Việc sao chép giá trị không gây rủi ro dữ liệu, tài chính hoặc vận hành.

### Trường hợp đang dùng `env: { ...process.env }`

Không phù hợp:

```js
module.exports = {
  env: {
    ...process.env,
  },
};
```

Phù hợp hơn:

```js
module.exports = {
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
};
```

Phương án ưu tiên:

```env
NEXT_PUBLIC_APP_URL=https://example.com
```

Sau đó loại bỏ cấu hình `env` khỏi `next.config.*` nếu không còn cần thiết.

## Ví dụ về một số dịch vụ phổ biến

### Stripe

Có thể public:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

Không được public:

```env
NEXT_PUBLIC_STRIPE_SECRET_KEY=sk_live_xxx
```

### Firebase

Một số Firebase config được dùng ở browser, nhưng vẫn cần review rule, permission, domain restriction và cấu hình project.

Cần review:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
```

### Sentry

Sentry DSN frontend thường có thể public, nhưng vẫn cần xác nhận theo cấu hình dự án.

Có thể public-safe tùy context:

```env
NEXT_PUBLIC_SENTRY_DSN=...
```

### GitHub token

Không được public:

```env
NEXT_PUBLIC_GITHUB_TOKEN=ghp_xxx
```

Token có thể cho phép đọc repository, ghi issue, tạo release hoặc thực hiện hành động khác tùy scope.

## Giới hạn của bộ rule

Bộ rule giúp giảm rủi ro cấu hình sai, nhưng không thay thế hoàn toàn code review hoặc secret scanner chuyên dụng.

Giới hạn chính:

- JavaScript/TypeScript quá dynamic có thể bị bỏ sót.
- Flow qua nhiều file có thể không được phân tích đầy đủ trong Semgrep Community.
- Secret có tên lạ và value không có format đặc trưng có thể không bị báo `ERROR`.
- Một số public config hợp lệ vẫn có thể bị báo `WARNING`.
- Rule không có business context của từng ứng dụng.

Khuyến nghị vận hành:

- Chặn `ERROR` trong CI/CD.
- Dùng `WARNING` làm tín hiệu review/audit.
- Kết hợp với secret scanning ở repository.
- Rotate/revoke credential khi nghi ngờ đã lộ.

## Cách chạy rule

Validate rule:

```powershell
.\.venv\Scripts\semgrep.exe --validate --config rules/nextjs-public-env-exposure.yaml
```

Chạy unit test rule:

```powershell
.\.venv\Scripts\semgrep.exe --test rules
```

Scan sample project:

```powershell
.\.venv\Scripts\semgrep.exe --config rules/nextjs-public-env-exposure.yaml sample-next-app
```

Scan dự án Next.js:

```powershell
.\.venv\Scripts\semgrep.exe --config rules/nextjs-public-env-exposure.yaml path\to\nextjs-project
```

## Checklist trước khi merge

Checklist đề xuất cho reviewer:

- Có thêm biến `NEXT_PUBLIC_*` mới không?
- Biến `NEXT_PUBLIC_*` đã được xác nhận là public-safe chưa?
- Có secret nào nằm trong `next.config.* env` không?
- Có dùng `...process.env` hoặc `env: process.env` không?
- Có alias của `process.env` được đưa vào `env` không?
- Có entry nào trong `next.config.* env` không thật sự cần public không?
- Cảnh báo `ERROR` đã được xử lý hoặc có phê duyệt exception chưa?
- Cảnh báo `WARNING` đã được review chưa?
- Nếu có `nosemgrep`, lý do ignore đã rõ ràng và kiểm chứng được chưa?

## Tài liệu tham khảo

- Next.js `next.config.js env`: https://nextjs.org/docs/pages/api-reference/config/next-config-js/env
- Next.js environment variables: https://nextjs.org/docs/pages/guides/environment-variables
- Semgrep taint mode: https://semgrep.dev/docs/writing-rules/data-flow/taint-mode/overview
- Semgrep testing rules: https://semgrep.dev/docs/writing-rules/testing-rules
