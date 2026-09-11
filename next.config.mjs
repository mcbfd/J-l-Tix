/** @type {import('next').NextConfig} */
const nextConfig = {
  // ─── Image Optimization ───────────────────────────────────────────────────
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
