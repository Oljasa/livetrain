import { transit_realtime } from 'gtfs-realtime-bindings';
import fetch from 'node-fetch';
import { TrainLocation, MTAConfig } from '@/types/mta';

export class MTAService {
  private config: MTAConfig;
  private static instance: MTAService;

  private constructor(config: MTAConfig) {
    this.config = config;
  }

  public static getInstance(config: MTAConfig): MTAService {
    if (!MTAService.instance) {
      MTAService.instance = new MTAService(config);
    }
    return MTAService.instance;
  }

  private async fetchGTFSData(): Promise<Buffer> {
    try {
      const response = await fetch(
        `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-${this.config.feedId}`,
        {
          headers: {
            'Accept': 'application/x-protobuf'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch GTFS data: ${response.statusText}`);
      }
      console.log(`Response: ${response}`);
      const arrayBuffer = await response.arrayBuffer();
      console.log(`Array Buffer: ${arrayBuffer}`);
      console.log('Response details:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers),
        type: response.type,
        url: response.url
      });

      const uint8Array = new Uint8Array(arrayBuffer);

      // Use the GTFS-realtime bindings to decode
      const feed = transit_realtime.FeedMessage.decode(uint8Array);

      // Log the actual train data in a readable format
      feed.entity.forEach(entity => {
        if (entity.vehicle) {
          console.log({
            trainId: entity.id,
            route: entity.vehicle.trip?.routeId,
            nextStop: entity.vehicle.stopId,
            status: entity.vehicle.currentStatus,
            timestamp: entity.vehicle.timestamp,
            position: entity.vehicle.position ? {
              lat: entity.vehicle.position.latitude,
              lon: entity.vehicle.position.longitude
            } : null
          });
        }
      });

      // Or if you want to see everything at once in a table
      console.table(feed.entity.map(entity => ({
        trainId: entity.id,
        route: entity.vehicle?.trip?.routeId,
        nextStop: entity.vehicle?.stopId,
        status: entity.vehicle?.currentStatus
      })));

      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error(`Error fetching GTFS data for ${this.config.feedId}:`, error);
      throw error;
    }
  }

  public async getTrainLocations(): Promise<TrainLocation[]> {
    try {
      const buffer = await this.fetchGTFSData();
      const feed = transit_realtime.FeedMessage.decode(buffer);
      
      console.log(`Total GTFS entities: ${feed.entity.length}`);
      
      // Get all entities with vehicle data - less strict filtering
      const vehicleEntities = feed.entity.filter((entity: transit_realtime.IFeedEntity) => 
        entity.vehicle && 
        entity.vehicle.trip
      );
      
      console.log(`Found ${vehicleEntities.length} entities with vehicle data`);
      
      const transformedTrains = vehicleEntities
        .map((entity: transit_realtime.IFeedEntity) => {
          const vehicle = entity.vehicle!;
          const routeId = vehicle.trip?.routeId || '';
          const stopId = vehicle.stopId || '';
          
          let direction: 'N' | 'S' = 'S';
          if (stopId) {
            const lastChar = stopId.charAt(stopId.length - 1);
            direction = lastChar === 'N' ? 'N' : 'S';
          }

          const train = {
            id: entity.id,
            routeId,
            latitude: vehicle.position?.latitude || 0,
            longitude: vehicle.position?.longitude || 0,
            direction,
            timestamp: Number(vehicle.timestamp || 0),
            nextStop: stopId,
            status: this.determineStatus(vehicle.currentStatus as number | undefined),
          };

          // Log each transformed train for debugging
          console.log('Transformed train:', train);
          
          return train;
        });

      console.log(`Transformed ${transformedTrains.length} trains`);

      // Only filter out trains with exactly 0 coordinates
      const validTrains = transformedTrains.filter(train => 
        train.latitude !== 0 || train.longitude !== 0
      );

      console.log(`Final valid trains: ${validTrains.length}`);
      
      return transformedTrains;
    } catch (error) {
      console.error('Error fetching train locations:', error);
      throw error;
    }
  }

  private determineStatus(status?: number): 'IN_TRANSIT' | 'STOPPED' | 'DELAYED' {
    switch (status) {
      case 0: // INCOMING_AT
      case 1: // STOPPED_AT
        return 'STOPPED';
      case 2: // IN_TRANSIT_TO
        return 'IN_TRANSIT';
      case 3: // DELAYED
        return 'DELAYED';
      default:
        return 'IN_TRANSIT';
    }
  }
} 