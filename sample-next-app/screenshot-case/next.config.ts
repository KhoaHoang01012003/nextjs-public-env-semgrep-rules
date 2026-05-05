const nextConfig = {
  env: {
    DIRECTUS_PUBLIC_TOKEN: process.env.DIRECTUS_PUBLIC_TOKEN,
    DIRECTUS_FORM_TOKEN: process.env.DIRECTUS_FORM_TOKEN,
    CACHE_REVALIDATE_SECRET: process.env.CACHE_REVALIDATE_SECRET,
    APP_ENV: process.env.APP_ENV,
    BUILD_NUMBER: process.env.BUILD_NUMBER,
  },
  images: {
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
