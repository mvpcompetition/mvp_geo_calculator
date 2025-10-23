const { 
    getPersonAddress, 
    getVenueAddress, 
    getPersonCoordinates, 
    getVenueCoordinates,
    updatePersonCoordinates,
    updateVenueCoordinates,
    savePersonVenueDistance
} = require('./database');
const { geocodeAddress, calculateDistance } = require('./googleMapsService');

/**
 * Main Lambda handler for geo calculations
 * @param {Object} event - Lambda event containing payload
 * @param {Object} context - Lambda context
 * @returns {Promise<Object>} Response object
 */
exports.handler = async (event, context) => {
    const startTime = Date.now();
    
    console.log('\n========================================');
    console.log('MVP GEO CALCULATOR STARTED');
    console.log('========================================');
    console.log('Triggered at:', new Date().toISOString());
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('========================================\n');
    
    try {
        // Extract payload from event
        const payload = event.body ? JSON.parse(event.body) : event;
        
        const { venueId1, venueId2, personId, type, recalc_fees } = payload;
        
        console.log(`[MAIN] Processing calculation type: ${type}`);
        console.log(`[MAIN] Parameters:`, { venueId1, venueId2, personId, recalc_fees });
        
        if (!type) {
            throw new Error('Missing required parameter: type');
        }
        
        let result;
        
        switch (type) {
            case 'person':
                result = await handlePersonGeocoding(personId);
                break;
                
            case 'venue':
                result = await handleVenueGeocoding(venueId1 || venueId2);
                break;
                
            case 'person_venue':
                result = await handlePersonVenueDistance(personId, venueId1 || venueId2);
                break;
                
            case 'venue_venue':
                result = await handleVenueVenueDistance(venueId1, venueId2);
                break;
                
            default:
                throw new Error(`Unknown calculation type: ${type}`);
        }
        
        const duration = Date.now() - startTime;
        console.log(`\n${'='.repeat(80)}`);
        console.log(`CALCULATION COMPLETED`);
        console.log(`${'='.repeat(80)}`);
        console.log(`Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
        console.log(`Type: ${type}`);
        console.log(`Result:`, JSON.stringify(result, null, 2));
        console.log(`${'='.repeat(80)}\n`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                type,
                result,
                duration,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('[MAIN ERROR] Calculation failed:', error);
        console.error('[MAIN ERROR] Stack trace:', error.stack);
        
        const duration = Date.now() - startTime;
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message,
                duration,
                timestamp: new Date().toISOString()
            })
        };
    }
};

/**
 * Handles geocoding for a person
 * @param {number} personId - The person ID
 * @returns {Promise<Object>} Geocoding result
 */
async function handlePersonGeocoding(personId) {
    console.log(`[HANDLER] Processing person geocoding for person ${personId}`);
    
    if (!personId) {
        throw new Error('Missing required parameter: personId');
    }
    
    // Get person address
    const address = await getPersonAddress(personId);
    if (!address) {
        throw new Error(`Person ${personId} not found or has no address`);
    }
    
    // Geocode the address
    const result = await geocodeAddress(address);
    
    // Update person record with coordinates and placeId
    await updatePersonCoordinates(personId, result.lat, result.lng, result.placeId || '');
    
    return {
        personId,
        address,
        coordinates: result
    };
}

/**
 * Handles geocoding for a venue
 * @param {number} venueId - The venue ID
 * @returns {Promise<Object>} Geocoding result
 */
async function handleVenueGeocoding(venueId) {
    console.log(`[HANDLER] Processing venue geocoding for venue ${venueId}`);
    
    if (!venueId) {
        throw new Error('Missing required parameter: venueId');
    }
    
    // Get venue address
    const address = await getVenueAddress(venueId);
    if (!address) {
        throw new Error(`Venue ${venueId} not found or has no address`);
    }
    
    // Geocode the address
    const result = await geocodeAddress(address);
    
    // Update venue record with coordinates and placeId
    await updateVenueCoordinates(venueId, result.lat, result.lng, result.placeId || '');
    
    return {
        venueId,
        address,
        coordinates: result
    };
}

/**
 * Handles distance calculation between person and venue
 * @param {number} personId - The person ID
 * @param {number} venueId - The venue ID
 * @returns {Promise<Object>} Distance calculation result
 */
async function handlePersonVenueDistance(personId, venueId) {
    console.log(`[HANDLER] Processing person-venue distance for person ${personId} and venue ${venueId}`);
    
    if (!personId || !venueId) {
        throw new Error('Missing required parameters: personId and venueId');
    }
    
    // Get coordinates
    const personCoords = await getPersonCoordinates(personId);
    if (!personCoords) {
        throw new Error(`Person ${personId} has no coordinates. Run 'person' geocoding first.`);
    }
    
    const venueCoords = await getVenueCoordinates(venueId);
    if (!venueCoords) {
        throw new Error(`Venue ${venueId} has no coordinates. Run 'venue' geocoding first.`);
    }
    
    // Calculate distance
    const distance = await calculateDistance(personCoords, venueCoords);
    
    // Save distance to database
    await savePersonVenueDistance(personId, venueId, distance.distanceMeters, distance.durationSeconds);
    
    return {
        personId,
        venueId,
        personCoordinates: personCoords,
        venueCoordinates: venueCoords,
        distance
    };
}

/**
 * Handles distance calculation between two venues
 * @param {number} venueId1 - The first venue ID
 * @param {number} venueId2 - The second venue ID
 * @returns {Promise<Object>} Distance calculation result
 */
async function handleVenueVenueDistance(venueId1, venueId2) {
    console.log(`[HANDLER] Processing venue-venue distance for venues ${venueId1} and ${venueId2}`);
    
    if (!venueId1 || !venueId2) {
        throw new Error('Missing required parameters: venueId1 and venueId2');
    }
    
    // Get coordinates
    const venue1Coords = await getVenueCoordinates(venueId1);
    if (!venue1Coords) {
        throw new Error(`Venue ${venueId1} has no coordinates. Run 'venue' geocoding first.`);
    }
    
    const venue2Coords = await getVenueCoordinates(venueId2);
    if (!venue2Coords) {
        throw new Error(`Venue ${venueId2} has no coordinates. Run 'venue' geocoding first.`);
    }
    
    // Calculate distance
    const distance = await calculateDistance(venue1Coords, venue2Coords);
    
    return {
        venueId1,
        venueId2,
        venue1Coordinates: venue1Coords,
        venue2Coordinates: venue2Coords,
        distance
    };
}
