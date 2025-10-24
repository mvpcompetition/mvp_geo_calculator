# Environment Variables for mvp-geo-calculator

## Required Environment Variables

Configure these in AWS Lambda Console → Configuration → Environment variables:

### Database Configuration
- **DB_HOST**: `mvp-admin-cluster.cluster-cxguyyacuvle.eu-west-1.rds.amazonaws.com`
- **DB_USER**: `mvpappadmin`
- **DB_PASSWORD**: `Ibahdn2007`
- **DB_NAME**: `dbMvp`
- **DB_PORT**: `3306`

### Google Maps API Configuration
- **GOOGLE_API_SECRET_NAME**: `mvp-google-maps-api-key` (already configured)
- **NODE_ENV**: `production` (already configured)

## AWS Secrets Manager Setup

The Google Maps API key must be stored in AWS Secrets Manager (NOT as an environment variable):

1. Go to AWS Secrets Manager console
2. Create or update secret named: `mvp-google-maps-api-key`
3. Store as JSON format:
   ```json
   {
     "apiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"
   }
   ```
4. Region: `eu-west-1`

The Lambda function will automatically fetch this secret using the `secretsManager.js` module.

## Security Note

⚠️ **All hardcoded credentials have been removed from the source code.** The application now relies entirely on environment variables and AWS Secrets Manager. This prevents credential exposure to developers who have access to the codebase.
