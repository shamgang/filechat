/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.modules = [ ...config.resolve.modules, '../node_modules'];
    return config;
  }
};

export default nextConfig;
