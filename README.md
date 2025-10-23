# MVP Geo Calculator

AWS Lambda function for geocoding addresses and calculating driving distances using Google Maps API.

## Features

- **Geocoding**: Convert person/venue addresses to LngLat coordinates
- **Distance Calculation**: Calculate driving distance between two locations
- **Database Integration**: Store coordinates in MySQL database
- **Secure API Key Management**: Uses AWS Secrets Manager

## Calculation Types

### 1. Person Geocoding (`type: "person"`)
Geocodes a person's address and stores LngLat coordinates.

**Payload:**
```json
{
  "personId": 123,
  "type": "person"
}
```

### 2. Venue Geocoding (`type: "venue"`)
Geocodes a venue's address and stores LngLat coordinates.

**Payload:**
```json
{
  "venueId1": 456,
  "type": "venue"
}
```

### 3. Person-Venue Distance (`type: "person_venue"`)
Calculates driving distance between a person and a venue.

**Payload:**
```json
{
  "personId": 123,
  "venueId1": 456,
  "type": "person_venue"
}
```

### 4. Venue-Venue Distance (`type: "venue_venue"`)
Calculates driving distance between two venues.

**Payload:**
```json
{
  "venueId1": 456,
  "venueId2": 789,
  "type": "venue_venue"
}
```

## Architecture

- **Runtime**: Node.js 20.x
- **VPC**: Connected to private subnets for database access
- **Database**: MySQL (mvp-database.c3qrae0mo5vn.eu-north-1.rds.amazonaws.com)
- **Secrets**: Google Maps API key stored in AWS Secrets Manager

## Deployment

### Prerequisites
1. AWS CLI configured with appropriate credentials
2. Google Maps API key stored in AWS Secrets Manager
3. VPC and security group configured

### Deploy Commands

```bash
# Package and deploy
npm run deploy

# View logs
npm run logs
```

### Manual Deployment Steps

1. **Create the CloudFormation stack:**
```bash
aws cloudformation deploy \
  --template-file template.yaml \
  --stack-name mvp-geo-calculator \
  --capabilities CAPABILITY_NAMED_IAM
```

2. **Package the function:**
```bash
cd src && npm install --production && zip -r ../function.zip . && cd ..
```

3. **Update function code:**
```bash
aws lambda update-function-code \
  --function-name mvp-geo-calculator \
  --zip-file fileb://function.zip
```

## Environment Variables

- `NODE_ENV`: production
- `GOOGLE_API_SECRET_NAME`: mvp-google-maps-api-key
- `AWS_REGION`: eu-north-1
- `DB_HOST`: mvp-database.c3qrae0mo5vn.eu-north-1.rds.amazonaws.com
- `DB_USER`: admin
- `DB_PASSWORD`: (configured in code)
- `DB_NAME`: mvp

## Database Schema

### Person Table
- `personId`: Primary key
- `personAddress`, `personZip`, `personCity`, `personCountry`: Address fields
- `personLng`, `personLat`: Coordinates (updated by this service)

### Venue Table
- `venueId`: Primary key
- `venueAddress`, `venueZip`, `venueCity`, `venueCountry`: Address fields
- `venueLng`, `venueLat`: Coordinates (updated by this service)

## Error Handling

The function handles various error scenarios:
- Missing or invalid parameters
- Database connection failures
- Google Maps API errors
- Missing coordinates for distance calculations

All errors are logged to CloudWatch and returned in the response.

## Monitoring

- **CloudWatch Logs**: `/aws/lambda/mvp-geo-calculator`
- **Log Retention**: 7 days
- **Timeout**: 30 seconds
- **Memory**: 512 MB

## Security

- IAM role with minimal required permissions
- VPC configuration for database access
- Secrets Manager for API key storage
- No hardcoded credentials

## Integration

This service is called by `mvp-queue-handler` when queue items require geocoding or distance calculations.

## Development

### Local Testing
```bash
# Install dependencies
cd src && npm install

# Run tests (if available)
npm test
```

## Support

For issues or questions, contact the development team.
