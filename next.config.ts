import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
      'https://*.cloudworkstations.dev',
      'https://*.firebase.studio',
    ],
  },
  // To use Google Maps, you need to create an API Key in the Google Cloud Console.
  // Once you have an API Key, create a .env.local file in the root of your project
  // and add your API Key as an environment variable:
  //
  // NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
  //
  // For custom map styling (optional), you can create a Map ID in the Google Cloud Console.
  // Then, add it to your .env.local file:
  // NEXT_PUBLIC_GOOGLE_MAP_ID=your_map_id_here
  //
  // Finally, you can uncomment the `mapId` prop in the Map components
  // in `src/components/neighbor-buy/LocationPicker.tsx` and `src/components/neighbor-buy/MapView.tsx`.
};

export default nextConfig;
