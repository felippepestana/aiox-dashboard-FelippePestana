import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'APEX Legal Performance',
    short_name: 'APEX Legal',
    description: 'APEX Legal Performance — Solução Jurídica Tecnológica de Alta Performance',
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
