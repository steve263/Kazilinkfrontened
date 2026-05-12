/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
      { protocol: "https", hostname: "source.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    staticGenerationRetryCount: 1,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 1,
  },
};

module.exports = nextConfig;