import type { NextConfig } from "next";

const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!value) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
const supabaseUrl = new URL(value);
if (!['https:', 'http:'].includes(supabaseUrl.protocol) || supabaseUrl.username || supabaseUrl.password || supabaseUrl.search || supabaseUrl.hash || supabaseUrl.pathname !== '/') {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL must be an HTTP(S) origin without credentials, query, or path');
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: supabaseUrl.protocol.slice(0, -1) as 'https' | 'http',
        hostname: supabaseUrl.hostname,
        port: supabaseUrl.port,
        pathname: '/storage/v1/object/public/portfolio-images/**',
        search: '',
      },
    ],
  },
};

export default nextConfig;
