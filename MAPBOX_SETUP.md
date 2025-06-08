# Mapbox Setup Guide

The uesugi-engine application requires a valid Mapbox access token to display maps.

## Quick Setup

1. **Get a Mapbox Access Token**
   - Go to [https://www.mapbox.com/](https://www.mapbox.com/)
   - Sign up for a free account
   - Navigate to your Account Dashboard
   - Click on "Access tokens" or go to [https://account.mapbox.com/access-tokens/](https://account.mapbox.com/access-tokens/)
   - Create a new token or copy the default public token

2. **Configure the Token**
   
   Create a `.env` file in the project root directory:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file and replace `YOUR_MAPBOX_TOKEN_HERE` with your actual token:
   ```
   MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsc29tZXRoaW5nIn0.actualTokenHere
   ```

3. **Restart the Application**
   ```bash
   docker compose restart frontend
   ```

## Troubleshooting

### Invalid Token Error
If you see "Not Authorized - Invalid Token" error:
- Make sure you copied the entire token (it should start with `pk.`)
- Check that the token has the necessary scopes enabled in your Mapbox dashboard
- Try creating a new token if the current one doesn't work

### Token Not Loading
If the application still shows "Mapboxアクセストークンが設定されていません":
- Ensure the `.env` file is in the project root (same directory as `docker-compose.yml`)
- Check that the environment variable name is exactly `MAPBOX_ACCESS_TOKEN`
- Try rebuilding the frontend container:
  ```bash
  docker compose down
  docker compose up --build frontend
  ```

### Free Tier Limits
The Mapbox free tier includes:
- 50,000 map loads per month
- 50,000 geocoding requests per month
- This is typically sufficient for development and small projects

## Alternative: Using a Different Map Provider

If you prefer not to use Mapbox, you could modify the application to use:
- OpenStreetMap with Leaflet
- Google Maps (requires Google Cloud account)
- Here Maps
- MapTiler

However, this would require significant code changes to the map components.