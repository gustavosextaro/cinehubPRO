/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable CSS optimization to ensure Tailwind processes correctly
  productionBrowserSourceMaps: false,
  
  experimental: {
    // Enable optimizations for production
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Force PostCSS to always process CSS files
  // This ensures Tailwind directives are compiled in production
  sassOptions: undefined,
  
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Don't modify CSS loaders - let Next.js use PostCSS config
    return config;
  },
};

module.exports = nextConfig;
