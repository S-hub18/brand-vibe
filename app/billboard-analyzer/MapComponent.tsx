'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

interface MapComponentProps {
  selectedLocation: { lat: number; lng: number } | null;
  onLocationSelect: (lat: number, lng: number) => void;
  drawerOpen: boolean;
}

// Custom marker icon
const createCustomIcon = () => {
  if (typeof window === 'undefined') return null;

  return L.divIcon({
    className: "custom-marker-pin",
    html: `
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="#e07a5f"/>
        <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="white" stroke-width="1.5" stroke-opacity="0.3"/>
        <circle cx="12" cy="9" r="3.5" fill="white"/>
        <circle cx="12" cy="9" r="2" fill="#f2cc8f"/>
      </svg>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 48],
    popupAnchor: [0, -48],
  });
};

// Component to handle map clicks
const MapClickController = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Component to pan map to selected location
const MapRecenter = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 16, {
        duration: 2
      });
    }
  }, [lat, lng, map]);
  return null;
};

// Component to handle Map resizing when drawer toggles
const MapResizeHandler = ({ open }: { open: boolean }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [open, map]);
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ selectedLocation, onLocationSelect, drawerOpen }) => {
  const customIcon = createCustomIcon();

  return (
    <div className="absolute inset-0 w-full h-full">
      <MapContainer
        center={[40.7128, -74.0060]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", position: "absolute", top: 0, left: 0 }}
        className="z-0"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        <MapClickController onLocationSelect={onLocationSelect} />
        <MapResizeHandler open={drawerOpen} />

        {selectedLocation && customIcon && (
          <>
            <Marker
              position={[selectedLocation.lat, selectedLocation.lng]}
              icon={customIcon}
            >
              <Popup>
                <div className="text-center p-2">
                  <p className="font-semibold text-[#e07a5f] text-sm">Selected Location</p>
                  <p className="text-xs text-slate-600">
                    {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
            <MapRecenter lat={selectedLocation.lat} lng={selectedLocation.lng} />
          </>
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
