const axios = require('axios');
const captainModel = require('../models/captain.model');
const suggestionCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

module.exports.getAddressCoordinate = async (address) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Easy-Go/1.0 (shantanukashyapsko@gmail.com)'
            }
        });
        
        if (response.data && response.data.length > 0) {
            const location = response.data[0];
            return {
                lat: parseFloat(location.lat),
                lng: parseFloat(location.lon)
            };
        } else {
            throw new Error('Unable to fetch coordinates');
        }
    } catch (error) {
        throw error;
    }
};

module.exports.getDistanceTime = async (origin, destination) => {
    if (!origin || !destination) {
        throw new Error('Origin and destination are required');
    }

    try {
        const originCoords = await module.exports.getAddressCoordinate(origin);
        const destCoords = await module.exports.getAddressCoordinate(destination);

        const distance = calculateDistance(
            originCoords.lat, originCoords.lng,
            destCoords.lat, destCoords.lng
        );

        const estimatedTimeMinutes = Math.round((distance / 30) * 60);

        return {
            distance: {
                text: `${distance.toFixed(1)} km`,
                value: Math.round(distance * 1000)
            },
            duration: {
                text: `${estimatedTimeMinutes} mins`,
                value: estimatedTimeMinutes * 60
            }
        };
    } catch (err) {
        throw new Error('Failed to calculate distance and time');
    }
};

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input || input.length < 3) {
        throw new Error('Input must be at least 3 characters');
    }

    const cacheKey = input.toLowerCase().trim();
 
    if (suggestionCache.has(cacheKey)) {
        const cached = suggestionCache.get(cacheKey);
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        } else {
            suggestionCache.delete(cacheKey);
        }
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=5&countrycodes=IN`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Easy-Go/1.0 (shantanukashyapsko@gmail.com)'
            },
            timeout: 5000
        });
        
        let results = [];
        if (response.data && response.data.length > 0) {
            results = response.data
                .map(prediction => prediction.display_name)
                .filter(value => value)
                .slice(0, 5);
        }

        suggestionCache.set(cacheKey, {
            data: results,
            timestamp: Date.now()
        });

        if (suggestionCache.size > 100) {
            const firstKey = suggestionCache.keys().next().value;
            suggestionCache.delete(firstKey);
        }

        return results;
    } catch (err) {
        throw err;
    }
};

module.exports.getCaptainsInTheRadius = async (lat, lng, radius) => {
    const captains = await captainModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius / 6371],
            }
        }
    });

    return captains;
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}