import { Station } from '@/types/mta';

export class StopService {
  private static instance: StopService;
  private stops: Map<string, Station> = new Map();
  private initialized = false;

  private constructor() {}

  public static getInstance(): StopService {
    if (!StopService.instance) {
      StopService.instance = new StopService();
    }
    return StopService.instance;
  }

  public async loadStops(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const baseUrl = typeof window === 'undefined' 
        ? 'http://localhost:3000' 
        : '';
      
      const response = await fetch(`${baseUrl}/api/stops`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stops: ${response.status} ${response.statusText}`);
      }
      
      const stops: Station[] = await response.json();
      
      // Store stops in the map
      stops.forEach(stop => {
        this.stops.set(stop.id, stop);
      });
      
      console.log(`Loaded ${this.stops.size} stations from API`);
      this.initialized = true;
    } catch (error) {
      console.error('Error loading stops:', error);
      throw error;
    }
  }

  public getStopById(stopId: string): Station | undefined {
    // Try exact match first
    let station = this.stops.get(stopId);
    
    // If no match, try without direction suffix
    if (!station && (stopId.endsWith('N') || stopId.endsWith('S'))) {
      station = this.stops.get(stopId.slice(0, -1));
    }
    
    // If still no match, try adding direction suffix
    if (!station && !stopId.endsWith('N') && !stopId.endsWith('S')) {
      station = this.stops.get(`${stopId}N`) || this.stops.get(`${stopId}S`);
    }
    
    return station;
  }

  public getAllStops(): Station[] {
    return Array.from(this.stops.values());
  }
} 