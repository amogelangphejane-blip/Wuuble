import { LocationSuggestion } from '@/types/events';

// Mock location data - in production, this would integrate with Google Places API, Mapbox, or similar
const mockLocations: LocationSuggestion[] = [
  {
    id: '1',
    name: 'Community Center',
    address: '123 Main Street, Downtown',
    type: 'venue',
    rating: 4.5,
    coordinates: { lat: 40.7128, lng: -74.0060 },
  },
  {
    id: '2',
    name: 'Central Park',
    address: 'Central Park, New York, NY',
    type: 'landmark',
    rating: 4.8,
    coordinates: { lat: 40.7829, lng: -73.9654 },
  },
  {
    id: '3',
    name: 'Public Library',
    address: '456 Oak Avenue, City Center',
    type: 'venue',
    rating: 4.3,
    coordinates: { lat: 40.7505, lng: -73.9934 },
  },
  {
    id: '4',
    name: 'Riverside Park',
    address: 'Riverside Drive, Upper West Side',
    type: 'landmark',
    rating: 4.6,
    coordinates: { lat: 40.7956, lng: -73.9722 },
  },
  {
    id: '5',
    name: 'Conference Center',
    address: '789 Business District, Suite 100',
    type: 'venue',
    rating: 4.4,
    coordinates: { lat: 40.7580, lng: -73.9855 },
  },
  {
    id: '6',
    name: 'Coffee House',
    address: '321 Cafe Street, Arts Quarter',
    type: 'business',
    rating: 4.2,
    coordinates: { lat: 40.7614, lng: -73.9776 },
  },
  {
    id: '7',
    name: 'Sports Complex',
    address: '555 Athletic Way, Sports District',
    type: 'venue',
    rating: 4.7,
    coordinates: { lat: 40.7282, lng: -73.9942 },
  },
  {
    id: '8',
    name: 'Art Gallery',
    address: '888 Culture Boulevard, Arts District',
    type: 'venue',
    rating: 4.5,
    coordinates: { lat: 40.7749, lng: -73.9442 },
  },
  {
    id: '9',
    name: 'Beach Pavilion',
    address: 'Oceanfront Drive, Beachside',
    type: 'landmark',
    rating: 4.9,
    coordinates: { lat: 40.5795, lng: -73.9692 },
  },
  {
    id: '10',
    name: 'Tech Hub',
    address: '999 Innovation Drive, Tech Quarter',
    type: 'business',
    rating: 4.6,
    coordinates: { lat: 40.7505, lng: -74.0134 },
  },
];

class LocationService {
  private static instance: LocationService;
  private userLocation: { lat: number; lng: number } | null = null;

  private constructor() {}

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  // Get user's current location
  async getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    if (this.userLocation) {
      return this.userLocation;
    }

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          resolve(this.userLocation);
        },
        (error) => {
          console.warn('Error getting user location:', error);
          resolve(null);
        },
        { timeout: 10000 }
      );
    });
  }

  // Calculate distance between two coordinates (Haversine formula)
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Search for locations based on query
  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const userLocation = await this.getUserLocation();
    const lowercaseQuery = query.toLowerCase();

    // Filter locations based on query
    let filteredLocations = mockLocations.filter(
      (location) =>
        location.name.toLowerCase().includes(lowercaseQuery) ||
        location.address.toLowerCase().includes(lowercaseQuery)
    );

    // Calculate distances if user location is available
    if (userLocation) {
      filteredLocations = filteredLocations.map((location) => ({
        ...location,
        distance: location.coordinates
          ? this.calculateDistance(
              userLocation.lat,
              userLocation.lng,
              location.coordinates.lat,
              location.coordinates.lng
            )
          : undefined,
      }));

      // Sort by distance
      filteredLocations.sort((a, b) => {
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    } else {
      // Sort by rating if no location available
      filteredLocations.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return filteredLocations.slice(0, 10); // Return top 10 results
  }

  // Get popular venues by type
  async getPopularVenues(type?: LocationSuggestion['type']): Promise<LocationSuggestion[]> {
    const userLocation = await this.getUserLocation();
    
    let venues = mockLocations;
    
    if (type) {
      venues = venues.filter(venue => venue.type === type);
    }

    // Calculate distances and sort
    if (userLocation) {
      venues = venues.map((venue) => ({
        ...venue,
        distance: venue.coordinates
          ? this.calculateDistance(
              userLocation.lat,
              userLocation.lng,
              venue.coordinates.lat,
              venue.coordinates.lng
            )
          : undefined,
      }));

      venues.sort((a, b) => {
        // First sort by rating, then by distance
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
        
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    } else {
      venues.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return venues.slice(0, 8);
  }

  // Get venue details (for future enhancement)
  async getVenueDetails(venueId: string): Promise<LocationSuggestion | null> {
    const venue = mockLocations.find(location => location.id === venueId);
    return venue || null;
  }

  // Format distance for display
  formatDistance(distance: number): string {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }

  // Generate Google Maps URL
  generateMapsUrl(location: LocationSuggestion): string {
    if (location.coordinates) {
      return `https://www.google.com/maps?q=${location.coordinates.lat},${location.coordinates.lng}`;
    } else {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;
    }
  }

  // Get directions URL
  getDirectionsUrl(destination: LocationSuggestion): string {
    if (destination.coordinates) {
      return `https://www.google.com/maps/dir/?api=1&destination=${destination.coordinates.lat},${destination.coordinates.lng}`;
    } else {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination.address)}`;
    }
  }
}

export const locationService = LocationService.getInstance();

// Hook for using location service
export const useLocationService = () => {
  const searchLocations = async (query: string): Promise<LocationSuggestion[]> => {
    return locationService.searchLocations(query);
  };

  const getPopularVenues = async (type?: LocationSuggestion['type']): Promise<LocationSuggestion[]> => {
    return locationService.getPopularVenues(type);
  };

  const getUserLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    return locationService.getUserLocation();
  };

  const formatDistance = (distance: number): string => {
    return locationService.formatDistance(distance);
  };

  const generateMapsUrl = (location: LocationSuggestion): string => {
    return locationService.generateMapsUrl(location);
  };

  const getDirectionsUrl = (destination: LocationSuggestion): string => {
    return locationService.getDirectionsUrl(destination);
  };

  return {
    searchLocations,
    getPopularVenues,
    getUserLocation,
    formatDistance,
    generateMapsUrl,
    getDirectionsUrl,
  };
};