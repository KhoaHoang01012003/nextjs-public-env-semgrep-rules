const leakedFromServer = process.env.STRIPE_SECRET_KEY;

module.exports = {
  reactStrictMode: true,
  env: {
    API_SECRET: "hardcoded-secret-value",
    STRIPE_BROWSER_KEY: "sk_live_FAKE",
    NEXT_PUBLIC_APP_URL: "https://example.com",
    PUBLIC_CONFIG_VALUE: leakedFromServer,
  },
};
