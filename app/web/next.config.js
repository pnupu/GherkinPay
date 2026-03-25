/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const config = {
  outputFileTracingRoot: path.join(__dirname, "../../"),

  turbopack: {
    root: path.join(__dirname, "../../"),
    resolveAlias: {
      fs: { browser: "./empty-module.js" },
      net: { browser: "./empty-module.js" },
      tls: { browser: "./empty-module.js" },
    },
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.externals.push("pino-pretty", "lokijs", "encoding");

    // Stub out jito-ts — pulled in transitively by @pythnetwork/solana-utils
    // but unused. Its bundled @solana/web3.js requires rpc-websockets paths
    // not exported by the installed version.
    config.resolve.alias = {
      ...config.resolve.alias,
      "jito-ts": false,
    };

    return config;
  },
};

export default config;
