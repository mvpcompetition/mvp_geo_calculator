# MVP Geo Calculator - Quick Reference

## Common Commands

```bash
# Deploy the function
npm run deploy

# View live logs
npm run logs

# Package only (no deploy)
npm run package
```

## Test Payloads

### Geocode a Person
```json
{
  "personId": 123,
  "type": "person"
}
```

### Geocode a Venue
```json
{
  "venueId1": 456,
  "type": "venue"
}
```

### Calculate Person-Venue Distance
```json
{
  "personId": 123,
  "venueId1": 456,
  "type": "person_venue"
}
```

### Calculate Venue-Venue Distance
```json
{
  "venueId1": 456,
  "venueId2": 789,
  "type": "venue_venue"
}
```

## AWS CLI Commands

```bash
# Invoke function directly
aws lambda invoke \
  --function-name mvp-geo-calculator \
  --payload '{"personId":123,"type":"person"}' \
  response.json

# View recent logs
aws logs tail /aws/lambda/mvp-geo-calculator --follow

# Update environment variable
aws lambda update-function-configuration \
  --function-name mvp-geo-calculator \
  --environment Variables={NODE_ENV=production,GOOGLE_API_SECRET_NAME=mvp-google-maps-api-key}
```

## Troubleshooting

### Check if function exists
```bash
aws lambda get-function --function-name mvp-geo-calculator
```

### View function configuration
```bash
aws lambda get-function-configuration --function-name mvp-geo-calculator
```

### Check CloudFormation stack
```bash
aws cloudformation describe-stacks --stack-name mvp-geo-calculator
```

### Verify Secrets Manager
```bash
aws secretsmanager get-secret-value --secret-id mvp-google-maps-api-key
```

## Response Format

### Success Response
```json
{
  "statusCode": 200,
  "body": {
    "success": true,
    "type": "person",
    "result": {
      "personId": 123,
      "address": "123 Main St, Copenhagen, Denmark",
      "coordinates": {
        "lng": 12.5683,
        "lat": 55.6761
      }
    },
    "duration": 1234,
    "timestamp": "2024-10-23T16:44:00.000Z"
  }
}
```

### Error Response
```json
{
  "statusCode": 500,
  "body": {
    "success": false,
    "error": "Person 123 not found or has no address",
    "duration": 456,
    "timestamp": "2024-10-23T16:44:00.000Z"
  }
}
```

## Key Files

- `src/index.js` - Main Lambda handler
- `src/config.js` - Configuration
- `src/database.js` - Database operations
- `src/googleMapsService.js` - Google Maps API calls
- `src/secretsManager.js` - AWS Secrets Manager integration
- `template.yaml` - CloudFormation template
- `package.json` - Dependencies and scripts
