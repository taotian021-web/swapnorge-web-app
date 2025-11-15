// src/components/neighbor-buy/LocationPicker.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

interface LocationPickerProps {
  onLocationChange: (lat: number, lng: number) => void;
}

const SHANGHAI_CENTER = { lat: 31.2304, lng: 121.4737 };

export function LocationPicker({ onLocationChange }: LocationPickerProps) {
  const [center, setCenter] = useState(SHANGHAI_CENTER);
  const [markerPos, setMarkerPos] = useState(SHANGHAI_CENTER);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCenter(userPos);
        setMarkerPos(userPos);
        onLocationChange(userPos.lat, userPos.lng);
      },
      (error) => {
        console.warn('Could not get user location, defaulting to Shanghai.', error);
        // If user denies or it fails, we're already at the default.
        // We still call onLocationChange with the default coords.
        onLocationChange(SHANGHAI_CENTER.lat, SHANGHAI_CENTER.lng);
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

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
        center={center}
        defaultZoom={12}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
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
