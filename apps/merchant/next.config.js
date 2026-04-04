const path = require("path");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(path.resolve(__dirname, "../.."));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cashback/database", "@cashback/shared"],
  env: {
    AUTH_SECRET:
      process.env.AUTH_SECRET ??
      process.env.NEXTAUTH_SECRET ??
      "dev-secret-not-for-production",
  },
};
module.exports = nextConfig;
