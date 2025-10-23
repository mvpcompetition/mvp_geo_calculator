const mysql = require('mysql2/promise');
const config = require('./config');

let pool = null;

/**
 * Gets or creates a MySQL connection pool
 * @returns {Promise<mysql.Pool>} MySQL connection pool
 */
function getPool() {
    if (!pool) {
        console.log('[DB] Creating new MySQL connection pool');
        pool = mysql.createPool(config.database);
    }
    return pool;
}

/**
 * Fetch person address from database
 * @param {number} personId - Person ID
 * @returns {Promise<Object>} Person address data
 */
async function getPersonAddress(personId) {
    console.log(`[DB] Fetching address for person ID: ${personId}`);
    const pool = getPool();
    
    const [rows] = await pool.execute(
        'SELECT personId, personAddressLine1, personAddressLine2, personPostalCode, personPostalCity, personLatLng, personPlaceId FROM tblPerson WHERE personId = ?',
        [personId]
    );
    
    if (rows.length === 0) {
        throw new Error(`Person with ID ${personId} not found`);
    }
    
    return rows[0];
}

/**
 * Fetch venue address from database
 * @param {number} venueId - Venue ID
 * @returns {Promise<Object>} Venue address data
 */
async function getVenueAddress(venueId) {
    console.log(`[DB] Fetching address for venue ID: ${venueId}`);
    const pool = getPool();
    
    const [rows] = await pool.execute(
        'SELECT venueId, venueAddressLine1, venueAddressLine2, venuePostalCode, venuePostalCity, venueLatLng, venuePlaceId FROM tblVenue WHERE venueId = ?',
        [venueId]
    );
    
    if (rows.length === 0) {
        throw new Error(`Venue with ID ${venueId} not found`);
    }
    
    return rows[0];
}

/**
 * Get person coordinates from database
 * @param {number} personId - Person ID
 * @returns {Promise<Object>} Coordinates {lat, lng}
 */
async function getPersonCoordinates(personId) {
    console.log(`[DB] Fetching coordinates for person ID: ${personId}`);
    const pool = getPool();
    
    const [rows] = await pool.execute(
        'SELECT personLatLng FROM tblPerson WHERE personId = ?',
        [personId]
    );
    
    if (rows.length === 0 || !rows[0].personLatLng) {
        throw new Error(`Person ${personId} has no coordinates`);
    }
    
    const [lat, lng] = rows[0].personLatLng.split(',');
    return {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
    };
}

/**
 * Get venue coordinates from database
 * @param {number} venueId - Venue ID
 * @returns {Promise<Object>} Coordinates {lat, lng}
 */
async function getVenueCoordinates(venueId) {
    console.log(`[DB] Fetching coordinates for venue ID: ${venueId}`);
    const pool = getPool();
    
    const [rows] = await pool.execute(
        'SELECT venueLatLng FROM tblVenue WHERE venueId = ?',
        [venueId]
    );
    
    if (rows.length === 0 || !rows[0].venueLatLng) {
        throw new Error(`Venue ${venueId} has no coordinates`);
    }
    
    const [lat, lng] = rows[0].venueLatLng.split(',');
    return {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
    };
}

/**
 * Update person coordinates in database
 * @param {number} personId - Person ID
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} placeId - Google Place ID
 * @returns {Promise<void>}
 */
async function updatePersonCoordinates(personId, lat, lng, placeId = '') {
    console.log(`[DB] Updating coordinates for person ID: ${personId}`);
    const pool = getPool();
    
    const latLng = `${lat},${lng}`;
    await pool.execute(
        'UPDATE tblPerson SET personLatLng = ?, personPlaceId = ?, personRecalcCoordinates = 0 WHERE personId = ?',
        [latLng, placeId, personId]
    );
    
    console.log(`[DB] Successfully updated person ${personId} coordinates: ${latLng}`);
}

/**
 * Update venue coordinates in database
 * @param {number} venueId - Venue ID
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} placeId - Google Place ID
 * @returns {Promise<void>}
 */
async function updateVenueCoordinates(venueId, lat, lng, placeId = '') {
    console.log(`[DB] Updating coordinates for venue ID: ${venueId}`);
    const pool = getPool();
    
    const latLng = `${lat},${lng}`;
    await pool.execute(
        'UPDATE tblVenue SET venueLatLng = ?, venuePlaceId = ? WHERE venueId = ?',
        [latLng, placeId, venueId]
    );
    
    console.log(`[DB] Successfully updated venue ${venueId} coordinates: ${latLng}`);
}

/**
 * Save distance calculation results to database
 * @param {number} personId - Person ID
 * @param {number} venueId - Venue ID
 * @param {number} distanceMeters - Distance in meters
 * @param {number} durationSeconds - Duration in seconds
 * @returns {Promise<void>}
 */
async function savePersonVenueDistance(personId, venueId, distanceMeters, durationSeconds) {
    console.log(`[DB] Saving distance for person ${personId} to venue ${venueId}`);
    const pool = getPool();
    
    await pool.execute(
        `INSERT INTO tblPersonVenue (personId, venueId, personVenueMeters, personVenueSeconds)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
         personVenueMeters = VALUES(personVenueMeters),
         personVenueSeconds = VALUES(personVenueSeconds)`,
        [personId, venueId, distanceMeters, durationSeconds]
    );
    
    console.log(`[DB] Successfully saved distance data: ${distanceMeters}m, ${durationSeconds}s`);
}

/**
 * Closes the database connection pool
 */
async function closePool() {
    if (pool) {
        console.log('[DB] Closing MySQL connection pool');
        await pool.end();
        pool = null;
    }
}

module.exports = {
    getPersonAddress,
    getVenueAddress,
    getPersonCoordinates,
    getVenueCoordinates,
    updatePersonCoordinates,
    updateVenueCoordinates,
    savePersonVenueDistance,
    closePool
};
