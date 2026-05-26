import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin Turbopack's workspace root to this project so it doesn't get
  // confused by lockfiles further up the filesystem.
  turbopack: {
    root: path.resolve(),
  },
};

export default nextConfig;
