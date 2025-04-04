'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { useTrainData } from '@/lib/TrainContext';
import type { Map as LeafletMap } from 'leaflet';

// Dynamically import Leaflet with no SSR
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse bg-gray-200 rounded-lg" style={{ height: '600px', width: '100%' }} />
  ),
});

// Add these styles to fix the map tiles
const mapStyle = {
  height: '600px',
  width: '100%',
  position: 'relative' as const,
  zIndex: 0
};

// NYC Subway line colors
const routeColors: Record<string, string> = {
  'A': '#0039A6', // Blue
  'C': '#0039A6',
  'E': '#0039A6',
  'N': '#FCCC0A', // Yellow
  'Q': '#FCCC0A',
  'R': '#FCCC0A',
  'W': '#FCCC0A',
  'B': '#FF6319', // Orange
  'D': '#FF6319',
  'F': '#FF6319',
  'M': '#FF6319',
  'G': '#6CBE45', // Green
  'J': '#996633', // Brown
  'Z': '#996633',
  'L': '#A7A9AC', // Gray
  '1': '#EE352E', // Red
  '2': '#EE352E',
  '3': '#EE352E',
  '4': '#00933C', // Green
  '5': '#00933C',
  '6': '#00933C',
  '7': '#B933AD', // Purple
  'S': '#808183', // Gray
};

// Train icon based on route ID with NYC subway colors
const getTrainIcon = (routeId: string) => {
  const color = routeColors[routeId] || '#777777';
  
  return L.divIcon({
    html: `<div style="
      width: 28px;
      height: 28px;
      border-radius: 14px;
      background-color: ${color};
      color: white;
      font-weight: bold;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 0 4px rgba(0,0,0,0.5);
    ">${routeId}</div>`,
    className: 'train-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

export default function TrainMap() {
  const { trains, stations, isLoading, error, activeTrains } = useTrainData();

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        <h3 className="font-bold">Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Commenting out the route colors legend
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(routeColors).map(([routeId, color]) => (
          <div key={routeId} className="flex items-center">
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '10px',
              backgroundColor: color,
              color: 'white',
              fontWeight: 'bold',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '4px'
            }}>
              {routeId}
            </div>
          </div>
        ))}
      </div>
      */}
      
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      <div className="text-sm mb-2">
        {activeTrains === 0 ? (
          <div className="p-2 bg-yellow-100 text-yellow-800 rounded">
            No train data available. Try changing the subway line in the API route.
          </div>
        ) : (
          <div className="p-2 bg-green-100 text-green-800 rounded">
            Displaying {activeTrains} active trains
          </div>
        )}
      </div>
      
      <LeafletMap 
        trains={trains} 
        stations={stations} 
        style={mapStyle}
      />
    </div>
  );
} 