// src/components/neighbor-buy/LocationPicker.tsx
'use client';

import React, { useState } from 'react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface LocationPickerProps {
  onLocationChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER = { lat: 31.2304, lng: 121.4737 }; // Default to Shanghai

export function LocationPicker({ onLocationChange }: LocationPickerProps) {
  const [markerPos, setMarkerPos] = useState(DEFAULT_CENTER);

  const handleDragEnd = (e: google.maps.MapMouseEvent) => {
    const newPos = { lat: e.latLng!.lat(), lng: e.latLng!.lng() };
    setMarkerPos(newPos);
    onLocationChange(newPos.lat, newPos.lng);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    const newPos = { lat: e.latLng!.lat(), lng: e.latLng!.lng() };
    setMarkerPos(newPos);
    onLocationChange(newPos.lat, newPos.lng);
  };
  
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Map
        defaultCenter={DEFAULT_CENTER}
        defaultZoom={12}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        // To use a custom map style, create a Map ID in Google Cloud Console
        // and add it to your .env.local file as NEXT_PUBLIC_GOOGLE_MAP_ID
        // mapId={process.env.NEXT_PUBLIC_GOOGLE_MAP_ID}
        onClick={handleMapClick}
      >
        <AdvancedMarker
          position={markerPos}
          draggable={true}
          onDragEnd={handleDragEnd}
        >
          <Pin />
        </AdvancedMarker>
      </Map>
    </div>
  );
}
