import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FP Legal Performance',
    short_name: 'FP Legal',
    description: 'Felippe Pestana – Soluções Jurídicas Especializadas com Legal Performance',
    start_url: '/legal',
    display: 'standalone',
    background_color: '#060d1a',
    theme_color: '#0a1628',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
