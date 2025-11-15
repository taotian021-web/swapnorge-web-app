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
      >
        <AdvancedMarker position={position}>
            <Pin />
        </AdvancedMarker>
      </Map>
    </div>
  );
}
