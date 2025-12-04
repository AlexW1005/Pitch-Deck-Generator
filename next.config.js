/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['financialmodelingprep.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.financialmodelingprep.com',
      },
    ],
  },
}

module.exports = nextConfig




