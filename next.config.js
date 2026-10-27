/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Ship the seeded demo database with every server function (used on Vercel).
    outputFileTracingIncludes: {
      "/**": ["./prisma/seed.db"],
    },
  },
};

module.exports = nextConfig;
