const https = require('https');
const { getGoogleApiKey } = require('./secretsManager');

/**
 * Makes an HTTPS GET request
 * @param {string} url - The URL to fetch
 * @returns {Promise<any>} Parsed JSON response
 */
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(new Error(`Failed to parse JSON: ${error.message}`));
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * Geocodes an address to get LngLat coordinates
 * @param {string} address - The address to geocode
 * @returns {Promise<{lng: number, lat: number}>} Coordinates
 */
async function geocodeAddress(address) {
    console.log(`[GOOGLE] Geocoding address: ${address}`);
    
    const apiKey = await getGoogleApiKey();
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.google.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    try {
        const response = await httpsGet(url);
        
        if (response.status !== 'OK') {
            throw new Error(`Geocoding failed with status: ${response.status}`);
        }
        
        if (!response.results || response.results.length === 0) {
            throw new Error('No results found for address');
        }
        
        const location = response.results[0].geometry.location;
        console.log(`[GOOGLE] Geocoding successful: lng=${location.lng}, lat=${location.lat}`);
        
        return {
            lng: location.lng,
            lat: location.lat
        };
    } catch (error) {
        console.error('[GOOGLE ERROR] Geocoding failed:', error);
        throw new Error(`Geocoding failed: ${error.message}`);
    }
}

/**
 * Calculates driving distance between two LngLat coordinates
 * @param {{lng: number, lat: number}} origin - Origin coordinates
 * @param {{lng: number, lat: number}} destination - Destination coordinates
 * @returns {Promise<{distance: number, duration: number, distanceText: string, durationText: string}>} Distance info
 */
async function calculateDistance(origin, destination) {
    console.log(`[GOOGLE] Calculating distance from (${origin.lat},${origin.lng}) to (${destination.lat},${destination.lng})`);
    
    const apiKey = await getGoogleApiKey();
    const originLatLng = `${origin.lat},${origin.lng}`;
    const destLatLng = `${destination.lat},${destination.lng}`;
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?destinations=${encodeURIComponent(destLatLng)}&origins=${encodeURIComponent(originLatLng)}&key=${apiKey}`;
    
    try {
        const response = await httpsGet(url);
        
        if (response.status !== 'OK') {
            throw new Error(`Distance calculation failed with status: ${response.status}`);
        }
        
        if (!response.rows || response.rows.length === 0 || !response.rows[0].elements || response.rows[0].elements.length === 0) {
            throw new Error('No distance results found');
        }
        
        const element = response.rows[0].elements[0];
        
        if (element.status !== 'OK') {
            throw new Error(`Distance element status: ${element.status}`);
        }
        
        const result = {
            distance: element.distance.value, // meters
            duration: element.duration.value, // seconds
            distanceText: element.distance.text,
            durationText: element.duration.text
        };
        
        console.log(`[GOOGLE] Distance calculation successful: ${result.distanceText} (${result.durationText})`);
        
        return result;
    } catch (error) {
        console.error('[GOOGLE ERROR] Distance calculation failed:', error);
        throw new Error(`Distance calculation failed: ${error.message}`);
    }
}

module.exports = {
    geocodeAddress,
    calculateDistance
};
