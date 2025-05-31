
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Add your API hostname if it serves images directly and needs optimization
      // For example, if API_BASE_URL is http://localhost:8000
      // Note: remotePatterns require protocol, hostname, port (optional), pathname (optional)
      // For localhost, you might need to use a different hostname if running in a container or proxy
      {
        protocol: 'http', // or 'https' if your API is served over HTTPS
        hostname: 'localhost', // replace with your actual API hostname if different
        port: '8000', // replace with your API port if different
        pathname: '/proposals/**', // adjust pathname to be more specific if needed
      }
    ],
  },
};

export default nextConfig;
