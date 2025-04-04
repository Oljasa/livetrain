'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station, TrainLocation } from '@/types/mta';

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

interface LeafletMapProps {
  trains: TrainLocation[];
  stations: Station[];
  style: React.CSSProperties;
}

export default function LeafletMap({ trains, stations, style }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const trainMarkersRef = useRef<L.Marker[]>([]);
  const stationMarkersRef = useRef<Record<string, L.CircleMarker>>({});
  const [activeTrains, setActiveTrains] = useState<number>(0);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      // Center on NYC
      mapRef.current = L.map('map').setView([40.7128, -74.0060], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add station markers
  useEffect(() => {
    if (!mapRef.current || !stations.length) return;

    // Clear existing station markers
    Object.values(stationMarkersRef.current).forEach(marker => marker.remove());
    stationMarkersRef.current = {};

    stations.forEach(station => {
      const marker = L.circleMarker([station.latitude, station.longitude], {
        color: '#444',
        fillColor: '#ccc',
        fillOpacity: 0.6,
        radius: 4,
        weight: 1
      })
      .bindTooltip(station.name, { 
        permanent: false,
        direction: 'top',
        opacity: 0.9
      })
      .addTo(mapRef.current!);
      
      stationMarkersRef.current[station.id] = marker;
    });
  }, [stations]);

  // Update train markers when train data changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Store current map view state
    const currentCenter = mapRef.current.getCenter();
    const currentZoom = mapRef.current.getZoom();

    // Remove existing train markers
    trainMarkersRef.current.forEach(marker => marker.remove());
    trainMarkersRef.current = [];
    
    // Reset all station markers to default style
    Object.values(stationMarkersRef.current).forEach(marker => {
      marker.setStyle({
        color: '#444',
        fillColor: '#ccc',
        fillOpacity: 0.6,
        radius: 4,
        weight: 1
      });
    });

    // Filter out trains without valid coordinates
    const validTrains = trains.filter(train => 
      train.latitude !== 40.7128 && // Not the default NYC coordinates
      train.longitude !== -74.0060 &&
      train.latitude !== 0 && 
      train.longitude !== 0 && 
      !isNaN(train.latitude) && 
      !isNaN(train.longitude)
    );

    setActiveTrains(validTrains.length);

    // Process each train
    validTrains.forEach(train => {
      // Highlight the station with this train
      const stopId = train.nextStop?.endsWith('N') || train.nextStop?.endsWith('S') 
        ? train.nextStop 
        : train.nextStop;
      
      if (stopId) {
        const stationMarker = stationMarkersRef.current[stopId];
        
        if (stationMarker) {
          // Highlight station with train color
          const color = routeColors[train.routeId] || '#777777';
          stationMarker.setStyle({
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            radius: 6,
            weight: 2
          });
        }
      }
      
      // Add train marker
      const marker = L.marker([train.latitude, train.longitude], { 
        icon: getTrainIcon(train.routeId),
        zIndexOffset: 1000 // Make sure trains appear above stations
      })
      .bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-lg">${train.routeId} Train</h3>
          <p><strong>Status:</strong> ${train.status}</p>
          <p><strong>Station:</strong> ${train.stationName || train.nextStop}</p>
          <p><strong>Direction:</strong> ${train.direction === 'N' ? 'Northbound' : 'Southbound'}</p>
        </div>
      `)
      .addTo(mapRef.current!);
      
      trainMarkersRef.current.push(marker);
    });
    
    // Only set initial view on first load when no center/zoom is set
    if (trainMarkersRef.current.length > 0 && (!currentCenter || !currentZoom)) {
      const trainGroup = L.featureGroup(trainMarkersRef.current);
      mapRef.current.fitBounds(trainGroup.getBounds().pad(0.1));
    } else if (stations.length > 0 && (!currentCenter || !currentZoom)) {
      // If no trains but we have stations, fit to stations (only on first load)
      const stationLatLngs = stations
        .filter(s => s.latitude && s.longitude)
        .map(s => [s.latitude, s.longitude] as [number, number]);
      
      if (stationLatLngs.length) {
        const bounds = L.latLngBounds(stationLatLngs);
        mapRef.current.fitBounds(bounds.pad(0.1));
      }
    }

    // Restore the previous view state if it existed
    if (currentCenter && currentZoom) {
      mapRef.current.setView(currentCenter, currentZoom, { animate: false });
    }
  }, [trains, stations]);

  return <div id="map" style={style}></div>;
} 