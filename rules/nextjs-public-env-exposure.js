module.exports = {
  env: {
    // ruleid: nextjs-public-env.next-config-audit-any-env-entry, nextjs-public-env.next-config-secret-key
    API_SECRET: "hardcoded-secret-value",
  },
};

// ruleid: nextjs-public-env.next-config-spread-process-env
module.exports = {
  env: {
    ...process.env,
  },
};

// ruleid: nextjs-public-env.next-config-spread-process-env
module.exports = {
  env: process.env,
};

const commonJsEnvAlias = process.env;

// ruleid: nextjs-public-env.next-config-process-env-alias
module.exports = {
  env: commonJsEnvAlias,
};

module.exports = {
  env: {
    // ruleid: nextjs-public-env.next-config-audit-any-env-entry, nextjs-public-env.next-config-known-secret-value
    STRIPE_BROWSER_KEY: "sk_live_FAKE",
  },
};

module.exports = {
  env: {
    // ruleid: nextjs-public-env.next-config-audit-any-env-entry, nextjs-public-env.next-config-audit-public-env
    NEXT_PUBLIC_APP_URL: "https://example.com",
  },
};

const notNextConfig = {
  // ok: nextjs-public-env.next-config-secret-key
  env: {
    API_SECRET: "server-only",
  },
};

module.exports = {
  serverRuntimeConfig: {
    // ok: nextjs-public-env.next-config-secret-key
    API_SECRET: "server-only",
  },
};
