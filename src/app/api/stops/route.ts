import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'gtfs_subway', 'stops.txt');
    const text = await fs.readFile(filePath, 'utf-8');
    
    // Parse CSV
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    
    const stopIdIndex = headers.indexOf('stop_id');
    const stopNameIndex = headers.indexOf('stop_name');
    const stopLatIndex = headers.indexOf('stop_lat');
    const stopLonIndex = headers.indexOf('stop_lon');
    
    if (stopIdIndex === -1 || stopNameIndex === -1 || stopLatIndex === -1 || stopLonIndex === -1) {
      throw new Error('Missing required columns in stops.txt');
    }
    
    const stops = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      if (values.length <= 1) continue;

      const stopId = values[stopIdIndex].trim();
      
      // Include all stops without filtering
      stops.push({
        id: stopId,
        name: values[stopNameIndex].trim(),
        latitude: parseFloat(values[stopLatIndex]),
        longitude: parseFloat(values[stopLonIndex]),
        routes: []
      });
      
      // Also add versions with N/S suffixes for compatibility
      if (!stopId.endsWith('N') && !stopId.endsWith('S')) {
        // Add both N and S versions
        stops.push({
          id: `${stopId}N`,
          name: values[stopNameIndex].trim(),
          latitude: parseFloat(values[stopLatIndex]),
          longitude: parseFloat(values[stopLonIndex]),
          routes: []
        });
        
        stops.push({
          id: `${stopId}S`,
          name: values[stopNameIndex].trim(),
          latitude: parseFloat(values[stopLatIndex]),
          longitude: parseFloat(values[stopLonIndex]),
          routes: []
        });
      }
    }
    
    return NextResponse.json(stops);
  } catch (error) {
    console.error('Error loading stops:', error);
    return NextResponse.json(
      { error: 'Failed to load stops data' },
      { status: 500 }
    );
  }
} 