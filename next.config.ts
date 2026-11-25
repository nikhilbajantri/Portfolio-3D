import type { NextConfig } from 'next';

/** Applied to every route. No CSP script policy: Next's inline runtime and JSON-LD would need nonces. */
const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

/** Static assets that are not content-hashed: long cache, refreshed in the background. */
const ASSET_CACHE = { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' };
const ASSET_DIRS = ['fonts', 'audio', 'fallback', 'benchmarks', 'videos', 'models', 'textures', 'images'];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { formats: ['image/avif', 'image/webp'] },
  // GLSL files in /shaders are imported as raw strings.
  turbopack: {
    rules: {
      '*.{glsl,vert,frag}': { loaders: ['raw-loader'], as: '*.js' },
    },
  },
  webpack(config) {
    config.module.rules.push({ test: /\.(glsl|vert|frag)$/, type: 'asset/source' });
    return config;
  },
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      ...ASSET_DIRS.map((dir) => ({ source: `/${dir}/:path*`, headers: [ASSET_CACHE] })),
    ];
  },
};

export default nextConfig;
