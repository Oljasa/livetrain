import React, { createContext, useContext, useEffect, useState } from 'react';
import { TrainContextType, TrainLocation, Station, Route } from '@/types/mta';
import { StopService } from '@/services/stopService';

const TrainContext = createContext<TrainContextType | undefined>(undefined);

interface TrainProviderProps {
  children: React.ReactNode;
}

export function TrainProvider({ children }: TrainProviderProps) {
  const [trains, setTrains] = useState<TrainLocation[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTrains, setActiveTrains] = useState<number>(0);

  // Load stations from stops.txt
  useEffect(() => {
    const loadStops = async () => {
      try {
        const stopService = StopService.getInstance();
        await stopService.loadStops();
        setStations(stopService.getAllStops());
      } catch (err) {
        console.error('Error loading stations:', err);
      }
    };
    
    loadStops();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/trains');
        if (!response.ok) {
          throw new Error('Failed to fetch train data');
        }
        const data = await response.json();
        setTrains(data);
        
        // Calculate active trains
        const validTrains = data.filter((train: TrainLocation) => 
          train.latitude !== 40.7128 && // Not the default NYC coordinates
          train.longitude !== -74.0060 &&
          train.latitude !== 0 && 
          train.longitude !== 0 && 
          !isNaN(train.latitude) && 
          !isNaN(train.longitude)
        );
        setActiveTrains(validTrains.length);
        
        setLastUpdated(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch train data');
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchData();

    // Then set up polling every 15 seconds
    const interval = setInterval(fetchData, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TrainContext.Provider
      value={{
        trains,
        stations,
        routes,
        isLoading,
        error,
        lastUpdated,
        activeTrains,
      }}
    >
      {children}
    </TrainContext.Provider>
  );
}

export function useTrainData() {
  const context = useContext(TrainContext);
  if (context === undefined) {
    throw new Error('useTrainData must be used within a TrainProvider');
  }
  return context;
} 