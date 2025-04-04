export interface TrainLocation {
  id: string;
  routeId: string;
  latitude: number;
  longitude: number;
  direction: 'N' | 'S';
  timestamp: number;
  nextStop: string;
  stationName?: string;
  status: 'IN_TRANSIT' | 'STOPPED' | 'DELAYED';
}

export interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: string[];
}

export interface Route {
  id: string;
  name: string;
  color: string;
  textColor: string;
  stations: string[];
}

export interface MTAConfig {
  feedId: string;
}

export interface TrainContextType {
  trains: TrainLocation[];
  stations: Station[];
  routes: Route[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  activeTrains: number;
}

export interface Train {
  id: string;
  routeId: string;
  latitude: number;
  longitude: number;
  nextStop: string | null;
  status: 'IN_TRANSIT' | 'STOPPED' | 'DELAYED';
}

export interface Stop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  routes: string[];
} 