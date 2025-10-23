const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const config = require('./config');

let cachedApiKey = null;

/**
 * Retrieves the Google Maps API key from AWS Secrets Manager
 * @returns {Promise<string>} The Google Maps API key
 */
async function getGoogleApiKey() {
    if (cachedApiKey) {
        console.log('[SECRETS] Using cached Google API key');
        return cachedApiKey;
    }

    console.log(`[SECRETS] Fetching Google API key from Secrets Manager: ${config.google.secretName}`);
    
    const client = new SecretsManagerClient({ region: config.google.region });
    
    try {
        const command = new GetSecretValueCommand({
            SecretId: config.google.secretName
        });
        
        const response = await client.send(command);
        
        if (response.SecretString) {
            // Parse the secret (it's stored as JSON with a key field)
            const secret = JSON.parse(response.SecretString);
            cachedApiKey = secret.apiKey || secret.key || secret.GOOGLE_MAPS_API_KEY;
            
            if (!cachedApiKey) {
                throw new Error('API key not found in secret');
            }
            
            console.log('[SECRETS] Successfully retrieved Google API key');
            return cachedApiKey;
        } else {
            throw new Error('Secret string is empty');
        }
    } catch (error) {
        console.error('[SECRETS ERROR] Failed to retrieve Google API key:', error);
        throw new Error(`Failed to get Google API key: ${error.message}`);
    }
}

module.exports = { getGoogleApiKey };
