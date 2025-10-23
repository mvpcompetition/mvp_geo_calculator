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
 * Formats address object into search string (matching PHP logic)
 * @param {Object} addressObj - Address object with line1, line2, postal code, city
 * @returns {string} Formatted address string
 */
function formatAddressForGeocoding(addressObj) {
    let parts = [];
    
    // Add address line 1
    if (addressObj.personAddressLine1) parts.push(addressObj.personAddressLine1.trim());
    else if (addressObj.venueAddressLine1) parts.push(addressObj.venueAddressLine1.trim());
    
    // Add address line 2 if present
    if (addressObj.personAddressLine2) parts.push(addressObj.personAddressLine2.trim());
    else if (addressObj.venueAddressLine2) parts.push(addressObj.venueAddressLine2.trim());
    
    // Add postal code
    if (addressObj.personPostalCode) parts.push(addressObj.personPostalCode.trim());
    else if (addressObj.venuePostalCode) parts.push(addressObj.venuePostalCode.trim());
    
    // Add city
    if (addressObj.personPostalCity) parts.push(addressObj.personPostalCity.trim());
    else if (addressObj.venuePostalCity) parts.push(addressObj.venuePostalCity.trim());
    
    // Add country
    parts.push('Denmark');
    
    return parts.filter(p => p && p.length > 0).join(', ');
}

/**
 * Geocodes an address to get LngLat coordinates
 * @param {Object} addressObj - The address object from database
 * @returns {Promise<{lng: number, lat: number, placeId: string}>} Coordinates and place ID
 */
async function geocodeAddress(addressObj) {
    const formattedAddress = formatAddressForGeocoding(addressObj);
    console.log(`[GOOGLE] Geocoding address: ${formattedAddress}`);
    
    const apiKey = await getGoogleApiKey();
    const encodedAddress = encodeURIComponent(formattedAddress);
    const url = `https://maps.google.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
    
    try {
        const response = await httpsGet(url);
        
        if (response.status !== 'OK') {
            throw new Error(`Geocoding failed with status: ${response.status}`);
        }
        
        if (!response.results || response.results.length === 0) {
            throw new Error('No results found for address');
        }
        
        const result = response.results[0];
        const location = result.geometry.location;
        const placeId = result.place_id || '';
        
        console.log(`[GOOGLE] Geocoding successful: lat=${location.lat}, lng=${location.lng}, placeId=${placeId}`);
        
        return {
            lat: location.lat,
            lng: location.lng,
            placeId: placeId
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
