/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['nyxploaders-production.up.railway.app'],
  },
  eslint: {
    ignoreDuringBuilds: true,
    rules: {
  '@next/next/no-img-element': 'off'
}

  },
}

module.exports = nextConfig
