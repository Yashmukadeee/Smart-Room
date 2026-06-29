/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Security Headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking — kiosk is always same-origin
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Block MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Enable XSS protection in older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Only send referrer for same-origin requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Restrict camera/mic/etc for a kiosk app
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HTTP Strict Transport Security (1 year) — enforce HTTPS on Vercel
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
      // Cache static assets aggressively on CDN
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  // ── Performance ───────────────────────────────────────────────────────────
  // Compress responses for faster kiosk loading
  compress: true,

  // ── Logging ───────────────────────────────────────────────────────────────
  // Hide the X-Powered-By header to reduce information disclosure
  poweredByHeader: false,
};

export default nextConfig;
