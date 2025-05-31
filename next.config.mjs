/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Configurare pentru react-pdf
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    
    // Configurare pentru fișiere statice PDF.js
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto'
    });
    
    return config;
  },
  // Configurare pentru static files
  async headers() {
    return [
      {
        source: '/pdf-worker/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        source: '/cmaps/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/octet-stream',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
