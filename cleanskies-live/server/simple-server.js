const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Helper functions for AQI
function getAQICategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

function getAQIColor(aqi) {
  if (aqi <= 50) return '#00E400';
  if (aqi <= 100) return '#FFFF00';
  if (aqi <= 150) return '#FF8C00';
  if (aqi <= 200) return '#FF0000';
  if (aqi <= 300) return '#8F3F97';
  return '#7E0023';
}

function getAQIDescription(aqi) {
  if (aqi <= 50) return 'Air quality is satisfactory, and air pollution poses little or no risk.';
  if (aqi <= 100) return 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.';
  if (aqi <= 150) return 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
  if (aqi <= 200) return 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.';
  if (aqi <= 300) return 'Health alert: The risk of health effects is increased for everyone.';
  return 'Health warning of emergency conditions: everyone is more likely to be affected.';
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('public'));

// Mock user data (in-memory for demo)
let users = [];
let currentUserId = 1;

// Auth routes
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  
  // Check if user exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Create user
  const user = {
    id: currentUserId++,
    name,
    email,
    password, // In real app, this would be hashed
    healthData: {},
    preferences: {
      alertsEnabled: true,
      alertThreshold: 'unhealthy_sensitive',
      location: {}
    }
  };
  
  users.push(user);
  
  // Mock JWT token
  const token = 'mock-jwt-token-' + user.id;
  
  res.json({
    message: 'User created successfully',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      healthData: user.healthData,
      preferences: user.preferences
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  
  const token = 'mock-jwt-token-' + user.id;
  
  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      healthData: user.healthData,
      preferences: user.preferences
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const userId = token.replace('mock-jwt-token-', '');
  const user = users.find(u => u.id == userId);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      healthData: user.healthData,
      preferences: user.preferences
    }
  });
});

// Air quality routes
app.get('/api/airquality/current', async (req, res) => {
  try {
    // Get zipCode from query params or default to 90210
    const zipCode = req.query.zipCode || '90210';
    
    // Make request to AirNow API
    const airNowUrl = `https://www.airnowapi.org/aq/observation/zipCode/current/?format=json&zipCode=${zipCode}&distance=25&API_KEY=DD6F2B33-84EA-4CC6-80F1-54954C9049C3`;
    
    const response = await fetch(airNowUrl);
    const airNowData = await response.json();
    
    // Transform AirNow data to match our app's format
    const transformedData = {
      currentData: {
        timestamp: new Date().toISOString(),
        location: {
          zipCode: zipCode,
          city: airNowData[0]?.ReportingArea || 'Unknown',
          state: airNowData[0]?.StateCode || 'Unknown',
          country: 'USA'
        },
        aqi: {
          value: airNowData[0]?.AQI || 0,
          category: getAQICategory(airNowData[0]?.AQI || 0),
          color: getAQIColor(airNowData[0]?.AQI || 0),
          description: getAQIDescription(airNowData[0]?.AQI || 0)
        },
        pollutants: {
          pm25: {
            value: airNowData.find(item => item.ParameterName === 'PM2.5')?.AQI || 0,
            unit: 'μg/m³',
            description: 'Fine particulate matter'
          },
          pm10: {
            value: airNowData.find(item => item.ParameterName === 'PM10')?.AQI || 0,
            unit: 'μg/m³',
            description: 'Coarse particulate matter'
          },
          o3: {
            value: airNowData.find(item => item.ParameterName === 'O3')?.AQI || 0,
            unit: 'ppm',
            description: 'Ozone'
          },
          no2: {
            value: airNowData.find(item => item.ParameterName === 'NO2')?.AQI || 0,
            unit: 'ppm',
            description: 'Nitrogen dioxide'
          },
          so2: {
            value: airNowData.find(item => item.ParameterName === 'SO2')?.AQI || 0,
            unit: 'ppm',
            description: 'Sulfur dioxide'
          },
          co: {
            value: airNowData.find(item => item.ParameterName === 'CO')?.AQI || 0,
            unit: 'ppm',
            description: 'Carbon monoxide'
          }
        },
        weather: {
          temperature: 22.5, // AirNow doesn't provide weather, using placeholder
          humidity: 65,
          pressure: 1013.25,
          windSpeed: 12.5,
          windDirection: 245,
          visibility: 10.0,
          uvIndex: 6,
          description: 'Partly cloudy'
        },
        dataSource: 'AirNow API'
      },
      lastUpdated: new Date().toISOString()
    };
    
    res.json(transformedData);
  } catch (error) {
    console.error('Error fetching AirNow data:', error);
    res.status(500).json({ message: 'Error fetching air quality data from AirNow API' });
  }
});

app.get('/api/airquality/forecast', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'data/airQualitySample.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const airQualityData = JSON.parse(rawData);
    
    res.json({
      forecast: airQualityData.forecast,
      model: 'placeholder_time_series',
      accuracy: 0.75,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reading forecast data:', error);
    res.status(500).json({ message: 'Error fetching forecast data' });
  }
});

app.get('/api/airquality/map', async (req, res) => {
  try {
    // Get zipCode from query params or default to 90210
    const zipCode = req.query.zipCode || '90210';
    
    // Make request to AirNow API for map data
    const airNowUrl = `https://www.airnowapi.org/aq/observation/zipCode/current/?format=json&zipCode=${zipCode}&distance=25&API_KEY=DD6F2B33-84EA-4CC6-80F1-54954C9049C3`;
    
    const response = await fetch(airNowUrl);
    const airNowData = await response.json();
    
    // Transform AirNow data to map format
    const mapData = airNowData.map(item => ({
      id: `point_${item.ParameterName}_${item.SiteName}`,
      latitude: item.Latitude || 34.0522, // Default to LA if no lat/lng
      longitude: item.Longitude || -118.2437,
      aqi: item.AQI,
      category: getAQICategory(item.AQI),
      color: getAQIColor(item.AQI),
      pm25: airNowData.find(d => d.ParameterName === 'PM2.5')?.AQI || 0,
      pm10: airNowData.find(d => d.ParameterName === 'PM10')?.AQI || 0,
      timestamp: new Date().toISOString(),
      parameter: item.ParameterName,
      siteName: item.SiteName
    }));
    
    res.json({
      mapData: mapData,
      bounds: {
        north: Math.max(...mapData.map(p => p.latitude)),
        south: Math.min(...mapData.map(p => p.latitude)),
        east: Math.max(...mapData.map(p => p.longitude)),
        west: Math.min(...mapData.map(p => p.longitude))
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    res.status(500).json({ message: 'Error fetching map data from AirNow API' });
  }
});

app.get('/api/airquality/alerts', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'data/airQualitySample.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const airQualityData = JSON.parse(rawData);
    
    res.json({
      alerts: airQualityData.alerts,
      userThreshold: 'unhealthy_sensitive',
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error reading alerts data:', error);
    res.status(500).json({ message: 'Error fetching alerts data' });
  }
});

// User routes
app.put('/api/user/profile', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const userId = token.replace('mock-jwt-token-', '');
  const user = users.find(u => u.id == userId);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid token' });
  }
  
  // Update user
  Object.assign(user, req.body);
  
  res.json({
    message: 'Profile updated successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      healthData: user.healthData,
      preferences: user.preferences
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: development`);
  console.log(`📊 Air quality data: Using placeholder data`);
});
