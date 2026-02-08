/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
  },
 
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig