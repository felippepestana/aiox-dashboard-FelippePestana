import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AIOX Legal Performance',
    short_name: 'AIOX Legal',
    description: 'Plataforma Juridica Full-Service com IA',
    start_url: '/legal',
    display: 'standalone',
    background_color: '#0a0f1a',
    theme_color: '#f59e0b',
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
