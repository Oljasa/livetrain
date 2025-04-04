import { NextResponse } from 'next/server';
import { MTAService } from '@/services/mtaService';
import { StopService } from '@/services/stopService';

export async function GET() {
  try {
    const stopService = StopService.getInstance();
    await stopService.loadStops();

    const mtaService = MTAService.getInstance({
      feedId: 'nqrw'  // This matches the feedIds mapping in the custom instructions
    });

    const trains = await mtaService.getTrainLocations();
    
    // Keep only the essential debug log
    console.log(`Fetched ${trains.length} trains`);
    
    // Enhance train data with station coordinates
    const enhancedTrains = trains
      .map(train => {
        const stopId = train.nextStop;
        if (!stopId) {
          return null;
        }
        
        // Remove debug logs for stopId processing
        const station = stopService.getStopById(stopId);
        
        if (station) {
          return {
            ...train,
            stationName: station.name,
            latitude: station.latitude,
            longitude: station.longitude
          };
        }
        
        return null;
      })
      .filter(Boolean);
    
    // Keep this summary log
    console.log(`Enhanced ${enhancedTrains.length} trains with station coordinates`);
    
    return NextResponse.json(enhancedTrains);
  } catch (error) {
    console.error('Error fetching train data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Error stack:', errorStack);
    
    return NextResponse.json(
      { error: 'Failed to fetch train data', details: errorMessage },
      { status: 500 }
    );
  }
} 