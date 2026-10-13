import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SIMAG UNUGHA - Sistem Informasi Manajemen Magang',
    short_name: 'SIMAG',
    description: 'Sistem informasi manajemen magang UNUGHA Fakultas Matematika dan Ilmu Komputer',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#003820',
    icons: [
      {
        src: '/unugha-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/unugha-logo.png',
        sizes: '512x512',
        type: 'image/png',
      }
    ],
  }
}
