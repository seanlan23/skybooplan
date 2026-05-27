/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.booking.com' },
      { protocol: 'https', hostname: '**.bstatic.com' },
      { protocol: 'https', hostname: '**.airbnb.com' },
      { protocol: 'https', hostname: '**.hotels.com' },
      { protocol: 'https', hostname: '**.unsplash.com' },
    ],
  },
}

export default nextConfig
