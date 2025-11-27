import { YARD_GEOFENCES, MOCK_UNITS } from '../constants';

interface SamsaraVehicleLocation {
  id: string;
  name: string; // Used to match our Unit ID
  latitude: number;
  longitude: number;
  time: string;
}

// Haversine formula to calculate distance between two points in meters
const getDistanceFromLatLonInMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radius of the earth in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d;
};

const deg2rad = (deg: number) => {
  return deg * (Math.PI / 180);
};

// Helper to add random jitter to coordinates (approx +/- 100m)
const jitter = (coord: number) => {
  return coord + (Math.random() - 0.5) * 0.002;
};

export const fetchSamsaraLocations = async (apiToken: string): Promise<SamsaraVehicleLocation[]> => {
  console.log("Fetching Samsara locations..."); // Secure: Do not log token

  // MOCK RESPONSE for demonstration/bypass
  if (apiToken === 'demo') {
    return new Promise(resolve => {
        setTimeout(() => {
            const mockLocations: SamsaraVehicleLocation[] = MOCK_UNITS.map((unit, index) => {
                // Randomly assign location: 
                // 40% Davenport, 30% Movie Ranch, 30% Away
                const rand = Math.random();
                let lat, lng;

                if (rand < 0.4) {
                    // Davenport
                    const yard = YARD_GEOFENCES['Davenport'];
                    lat = jitter(yard.lat);
                    lng = jitter(yard.lng);
                } else if (rand < 0.7) {
                    // Movie Ranch
                    const yard = YARD_GEOFENCES['Movie Ranch'];
                    lat = jitter(yard.lat);
                    lng = jitter(yard.lng);
                } else {
                    // Away (e.g., Texas/New Mexico)
                    lat = 32.0000;
                    lng = -105.0000;
                }

                return {
                    id: `veh-${index}`,
                    name: unit.id, // Match exactly with our Unit IDs
                    latitude: lat,
                    longitude: lng,
                    time: new Date().toISOString()
                };
            });
            resolve(mockLocations);
        }, 1500);
    });
  }

  try {
      // Real API Call
      const response = await fetch('https://api.samsara.com/v1/fleet/locations', {
          headers: { 'Authorization': `Bearer ${apiToken}` }
      });
      if (!response.ok) throw new Error("Failed to fetch from Samsara");
      const data = await response.json();
      
      return data.vehicles.map((v: any) => ({
          id: v.id,
          name: v.name,
          latitude: v.location.lat,
          longitude: v.location.lng,
          time: v.location.time
      }));

  } catch (e) {
      console.error(e);
      throw new Error("Connection failed. Ensure API Token is valid and CORS is enabled.");
  }
};

export const getUnitsInYard = (
  vehicles: SamsaraVehicleLocation[], 
  yardName: string
): string[] => {
  const yard = YARD_GEOFENCES[yardName];
  if (!yard) return [];

  return vehicles
    .filter(vehicle => {
      const distance = getDistanceFromLatLonInMeters(
        vehicle.latitude, 
        vehicle.longitude, 
        yard.lat, 
        yard.lng
      );
      return distance <= yard.radiusMeters;
    })
    .map(vehicle => vehicle.name);
};