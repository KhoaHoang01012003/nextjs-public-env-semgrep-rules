const leakedFromServer = process.env.STRIPE_SECRET_KEY;

// ruleid: nextjs-public-env.next-config-process-env-secret-flow
export default {
  env: {
    // ruleid: nextjs-public-env.next-config-audit-any-env-entry
    PUBLIC_CONFIG_VALUE: leakedFromServer,
  },
};

const allServerEnv = process.env;

// ruleid: nextjs-public-env.next-config-process-env-alias
export default {
  env: allServerEnv,
};

const cfg = {
  env: {
    // ruleid: nextjs-public-env.next-config-audit-any-env-entry, nextjs-public-env.next-config-secret-key
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
  },
};

export default cfg;

export default {
  env: {
    // ruleid: nextjs-public-env.next-config-audit-any-env-entry, nextjs-public-env.next-config-audit-public-env
    NEXT_PUBLIC_FEATURE_FLAG: "enabled",
  },
};

const screenshotLikeConfig = {
  env: {
    // ruleid: nextjs-public-env.next-config-audit-any-env-entry, nextjs-public-env.next-config-secret-key
    DIRECTUS_PUBLIC_TOKEN: process.env.DIRECTUS_PUBLIC_TOKEN,
    // ruleid: nextjs-public-env.next-config-audit-any-env-entry, nextjs-public-env.next-config-secret-key
    DIRECTUS_FORM_TOKEN: process.env.DIRECTUS_FORM_TOKEN,
    // ruleid: nextjs-public-env.next-config-audit-any-env-entry, nextjs-public-env.next-config-secret-key
    CACHE_REVALIDATE_SECRET: process.env.CACHE_REVALIDATE_SECRET,
    // ruleid: nextjs-public-env.next-config-audit-any-env-entry
    APP_ENV: process.env.APP_ENV,
    // ruleid: nextjs-public-env.next-config-audit-any-env-entry
    BUILD_NUMBER: process.env.BUILD_NUMBER,
  },
};

export default screenshotLikeConfig;

const safeConfig = {
  experimental: {
    typedRoutes: true,
  },
};

export { safeConfig };
