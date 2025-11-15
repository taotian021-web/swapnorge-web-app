// src/components/neighbor-buy/MapView.tsx
'use client';

import React from 'react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface MapViewProps {
  position: { lat: number; lng: number };
}

export function MapView({ position }: MapViewProps) {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Map
        center={position}
        defaultZoom={15}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        // To use a custom map style, create a Map ID in Google Cloud Console
        // and add it to your .env.local file as NEXT_PUBLIC_GOOGLE_MAP_ID
        // mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
      >
        <AdvancedMarker position={position}>
            <Pin />
        </AdvancedMarker>
      </Map>
    </div>
  );
}
