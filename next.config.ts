import type { NextConfig } from "next";

// Use NEXT_PUBLIC_BASE_PATH to explicitly set basePath in environments that need it.
// If not provided, default to empty so local serving of `out` works without subpath.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  basePath,
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
