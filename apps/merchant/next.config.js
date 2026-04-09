const path = require("path");
const { loadEnvConfig } = require("@next/env");
const { PrismaPlugin } = require("@prisma/nextjs-monorepo-workaround-plugin");

loadEnvConfig(path.resolve(__dirname, "../.."));

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cashback/database", "@cashback/shared"],
  webpack: (config, { dev, isServer, nextRuntime }) => {
    if (!dev && (isServer || nextRuntime === "edge")) {
      config.devtool = false;
    }

    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }

    return config;
  },
  env: {
    AUTH_SECRET:
      process.env.AUTH_SECRET ??
      process.env.NEXTAUTH_SECRET ??
      "dev-secret-not-for-production",
  },
};
module.exports = nextConfig;
