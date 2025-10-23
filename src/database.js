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
 * Fetches a person's address from the database
 * @param {number} personId - The person ID
 * @returns {Promise<string|null>} The formatted address or null
 */
async function getPersonAddress(personId) {
    const pool = getPool();
    console.log(`[DB] Fetching address for person ID: ${personId}`);
    
    const [rows] = await pool.execute(
        'SELECT personAddress, personZip, personCity, personCountry FROM person WHERE personId = ?',
        [personId]
    );
    
    if (rows.length === 0) {
        console.log(`[DB] Person ${personId} not found`);
        return null;
    }
    
    const person = rows[0];
    const addressParts = [
        person.personAddress,
        person.personZip,
        person.personCity,
        person.personCountry
    ].filter(part => part && part.trim());
    
    const address = addressParts.join(', ');
    console.log(`[DB] Person address: ${address}`);
    return address;
}

/**
 * Fetches a venue's address from the database
 * @param {number} venueId - The venue ID
 * @returns {Promise<string|null>} The formatted address or null
 */
async function getVenueAddress(venueId) {
    const pool = getPool();
    console.log(`[DB] Fetching address for venue ID: ${venueId}`);
    
    const [rows] = await pool.execute(
        'SELECT venueAddress, venueZip, venueCity, venueCountry FROM venue WHERE venueId = ?',
        [venueId]
    );
    
    if (rows.length === 0) {
        console.log(`[DB] Venue ${venueId} not found`);
        return null;
    }
    
    const venue = rows[0];
    const addressParts = [
        venue.venueAddress,
        venue.venueZip,
        venue.venueCity,
        venue.venueCountry
    ].filter(part => part && part.trim());
    
    const address = addressParts.join(', ');
    console.log(`[DB] Venue address: ${address}`);
    return address;
}

/**
 * Gets LngLat coordinates for a person
 * @param {number} personId - The person ID
 * @returns {Promise<{lng: number, lat: number}|null>} Coordinates or null
 */
async function getPersonLngLat(personId) {
    const pool = getPool();
    console.log(`[DB] Fetching LngLat for person ID: ${personId}`);
    
    const [rows] = await pool.execute(
        'SELECT personLng, personLat FROM person WHERE personId = ?',
        [personId]
    );
    
    if (rows.length === 0 || !rows[0].personLng || !rows[0].personLat) {
        console.log(`[DB] LngLat not found for person ${personId}`);
        return null;
    }
    
    return {
        lng: parseFloat(rows[0].personLng),
        lat: parseFloat(rows[0].personLat)
    };
}

/**
 * Gets LngLat coordinates for a venue
 * @param {number} venueId - The venue ID
 * @returns {Promise<{lng: number, lat: number}|null>} Coordinates or null
 */
async function getVenueLngLat(venueId) {
    const pool = getPool();
    console.log(`[DB] Fetching LngLat for venue ID: ${venueId}`);
    
    const [rows] = await pool.execute(
        'SELECT venueLng, venueLat FROM venue WHERE venueId = ?',
        [venueId]
    );
    
    if (rows.length === 0 || !rows[0].venueLng || !rows[0].venueLat) {
        console.log(`[DB] LngLat not found for venue ${venueId}`);
        return null;
    }
    
    return {
        lng: parseFloat(rows[0].venueLng),
        lat: parseFloat(rows[0].venueLat)
    };
}

/**
 * Updates person LngLat coordinates in the database
 * @param {number} personId - The person ID
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 */
async function updatePersonLngLat(personId, lng, lat) {
    const pool = getPool();
    console.log(`[DB] Updating LngLat for person ${personId}: ${lng}, ${lat}`);
    
    await pool.execute(
        'UPDATE person SET personLng = ?, personLat = ? WHERE personId = ?',
        [lng, lat, personId]
    );
    
    console.log(`[DB] Successfully updated person ${personId} LngLat`);
}

/**
 * Updates venue LngLat coordinates in the database
 * @param {number} venueId - The venue ID
 * @param {number} lng - Longitude
 * @param {number} lat - Latitude
 */
async function updateVenueLngLat(venueId, lng, lat) {
    const pool = getPool();
    console.log(`[DB] Updating LngLat for venue ${venueId}: ${lng}, ${lat}`);
    
    await pool.execute(
        'UPDATE venue SET venueLng = ?, venueLat = ? WHERE venueId = ?',
        [lng, lat, venueId]
    );
    
    console.log(`[DB] Successfully updated venue ${venueId} LngLat`);
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
    getPersonLngLat,
    getVenueLngLat,
    updatePersonLngLat,
    updateVenueLngLat,
    closePool
};
