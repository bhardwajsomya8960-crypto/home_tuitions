const axios = require('axios');

class GeoService {
  constructor() {
    this.googleMapsKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';
  }

  // Geocode address to coordinates
  async geocodeAddress(address, pincode) {
    try {
      const query = `${address}, ${pincode}`;
      const response = await axios.get(
        `${this.baseUrl}/geocode/json`,
        {
          params: {
            address: query,
            key: this.googleMapsKey
          }
        }
      );

      if (response.data.results.length === 0) {
        throw new Error('Address not found');
      }

      const location = response.data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: response.data.results[0].formatted_address
      };
    } catch (error) {
      console.error('Geocoding error:', error.message);
      throw error;
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get nearby tutors for a lead
  async findNearbyTutors(parentLat, parentLon, tutors, maxRadius = 12) {
    const nearby = tutors
      .map(tutor => ({
        ...tutor,
        distance: this.calculateDistance(
          parentLat, parentLon,
          tutor.latitude, tutor.longitude
        )
      }))
      .filter(tutor => tutor.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance);

    return nearby;
  }

  // Place autocomplete for address search
  async placeAutocomplete(input) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/place/autocomplete/json`,
        {
          params: {
            input,
            key: this.googleMapsKey,
            components: 'country:in'
          }
        }
      );

      return response.data.predictions || [];
    } catch (error) {
      console.error('Autocomplete error:', error.message);
      return [];
    }
  }
}

module.exports = new GeoService();
