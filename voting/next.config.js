/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  i18n: {
    locales: ["fr"],
    defaultLocale: "fr",
  },
};

module.exports = nextConfig;
