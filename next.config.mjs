/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: [
    '192.168.1.9',        
    '192.168.1.*',        
    'localhost',
  ],
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
