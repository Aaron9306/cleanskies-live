const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const auth = require('../middleware/auth');

// --- Helpers: AQI calculation (EPA breakpoints for PM2.5) ---
function calculateAqiFromPm25(pm25) {
  if (pm25 == null || Number.isNaN(pm25)) return { value: null, category: 'Unknown', description: 'No PM2.5 data' };
  const ranges = [
    { cLow: 0.0, cHigh: 12.0, iLow: 0, iHigh: 50, category: 'Good' },
    { cLow: 12.1, cHigh: 35.4, iLow: 51, iHigh: 100, category: 'Moderate' },
    { cLow: 35.5, cHigh: 55.4, iLow: 101, iHigh: 150, category: 'Unhealthy for Sensitive Groups' },
    { cLow: 55.5, cHigh: 150.4, iLow: 151, iHigh: 200, category: 'Unhealthy' },
    { cLow: 150.5, cHigh: 250.4, iLow: 201, iHigh: 300, category: 'Very Unhealthy' },
    { cLow: 250.5, cHigh: 500.4, iLow: 301, iHigh: 500, category: 'Hazardous' },
  ];
  const bp = ranges.find(r => pm25 >= r.cLow && pm25 <= r.cHigh);
  if (!bp) return { value: 500, category: 'Hazardous', description: 'PM2.5 extremely high' };
  const aqi = Math.round(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow);
  const descMap = {
    'Good': 'Air quality is satisfactory and poses little or no risk',
    'Moderate': 'Acceptable; some pollutants may be a concern for a few',
    'Unhealthy for Sensitive Groups': 'Members of sensitive groups may experience health effects',
    'Unhealthy': 'Everyone may begin to experience health effects',
    'Very Unhealthy': 'Health alert: everyone may experience more serious effects',
    'Hazardous': 'Emergency conditions. The entire population is likely to be affected',
  };
  return { value: aqi, category: bp.category, description: descMap[bp.category] };
}

async function fetchOpenAqMeasurements(lat, lng, radiusMeters = 10000) {
  const url = new URL('https://api.openaq.org/v3/measurements');
  url.searchParams.set('coordinates', `${lat},${lng}`);
  url.searchParams.set('radius', String(radiusMeters));
  url.searchParams.set('limit', '50');
  url.searchParams.set('order_by', 'datetime');
  url.searchParams.set('sort', 'desc');
  url.searchParams.set('parameters_id', ['2','3','7','10','1','6'].join(',')); // pm25, pm10, o3, no2, co, so2

  const headers = {};
  if (process.env.OPENAQ_API_KEY) headers['X-API-Key'] = process.env.OPENAQ_API_KEY;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAQ error ${res.status}: ${text}`);
  }
  return await res.json();
}

const router = express.Router();

// @route   GET /api/airquality/current
// @desc    Get current air quality data
// @access  Private
router.get('/current', auth, async (req, res) => {
  try {
    // Preferred coordinates: user preferences -> query -> fallback to sample city (NYC)
    const qLat = parseFloat(req.query.lat ?? req.user?.preferences?.location?.latitude ?? '40.7128');
    const qLng = parseFloat(req.query.lng ?? req.user?.preferences?.location?.longitude ?? '-74.0060');

    // Try OpenAQ first; fall back to sample file on error
    let pm25 = null, pm10 = null, o3 = null, no2 = null, so2 = null, co = null, updatedAt = new Date().toISOString();
    try {
      const openaq = await fetchOpenAqMeasurements(qLat, qLng, 15000);
      // Take the most recent value per parameter
      const latestByParam = {};
      for (const m of openaq.results || []) {
        const p = m.parameter?.name || m.parameter;
        if (!latestByParam[p]) latestByParam[p] = m;
      }
      pm25 = latestByParam.pm25?.value ?? null;
      pm10 = latestByParam.pm10?.value ?? null;
      o3 = latestByParam.o3?.value ?? null;
      no2 = latestByParam.no2?.value ?? null;
      so2 = latestByParam.so2?.value ?? null;
      co = latestByParam.co?.value ?? null;
      updatedAt = latestByParam.pm25?.datetime?.utc || updatedAt;
    } catch (e) {
      // Graceful fallback to bundled sample
      const dataPath = path.join(__dirname, '../data/airQualitySample.json');
      const rawData = await fs.readFile(dataPath, 'utf8');
      const sample = JSON.parse(rawData);
      pm25 = sample.currentData.pollutants.pm25.value;
      pm10 = sample.currentData.pollutants.pm10.value;
      o3 = sample.currentData.pollutants.o3.value;
      no2 = sample.currentData.pollutants.no2.value;
      so2 = sample.currentData.pollutants.so2.value;
      co = sample.currentData.pollutants.co.value;
    }

    const aqi = calculateAqiFromPm25(Number(pm25));

    // Minimal weather placeholder (replace with Open-Meteo later)
    const weather = {
      temperature: 22,
      humidity: 55,
      windSpeed: 3.2,
      visibility: 10,
      uvIndex: 4,
      description: 'Partly cloudy (placeholder)'
    };

    // Personalization
    const userHealthData = req.user?.healthData;
    let personalizedRecommendations = [];
    if (userHealthData?.sensitivity === 'high' || userHealthData?.conditions?.includes('asthma')) {
      if ((aqi.value ?? 0) > 50) {
        personalizedRecommendations.push({
          type: 'health_warning',
          message: 'High sensitivity detected: consider limiting outdoor exposure',
          severity: 'high'
        });
      }
    }
    if (userHealthData?.conditions?.includes('copd') && (aqi.value ?? 0) > 100) {
      personalizedRecommendations.push({
        type: 'health_warning',
        message: 'COPD: Avoid outdoor activities due to poor air quality',
        severity: 'critical'
      });
    }

    const response = {
      currentData: {
        aqi,
        pollutants: {
          pm25: { value: pm25, unit: 'µg/m³', description: 'Particulate Matter <2.5µm' },
          pm10: { value: pm10, unit: 'µg/m³', description: 'Particulate Matter <10µm' },
          o3: { value: o3, unit: 'µg/m³', description: 'Ozone' },
          no2: { value: no2, unit: 'µg/m³', description: 'Nitrogen Dioxide' },
          so2: { value: so2, unit: 'µg/m³', description: 'Sulfur Dioxide' },
          co: { value: co, unit: 'µg/m³', description: 'Carbon Monoxide' },
        },
        weather,
        timestamp: updatedAt
      },
      personalizedRecommendations,
      lastUpdated: new Date().toISOString(),
      dataSource: process.env.OPENAQ_API_KEY ? 'openaq_v3' : 'openaq_v3_or_sample'
    };

    res.json(response);
  } catch (error) {
    console.error('Air quality data error:', error);
    res.status(500).json({ 
      message: 'Error fetching air quality data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/airquality/forecast
// @desc    Get air quality forecast
// @access  Private
router.get('/forecast', auth, async (req, res) => {
  try {
    // TODO: Implement real forecasting model
    // 1. Time-series analysis of historical data
    // 2. Weather pattern correlation
    // 3. Machine learning model for prediction
    
    const dataPath = path.join(__dirname, '../data/airQualitySample.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const airQualityData = JSON.parse(rawData);
    
    res.json({
      forecast: airQualityData.forecast,
      model: 'placeholder_time_series', // Will be 'real_forecasting_model' when implemented
      accuracy: 0.75, // Placeholder accuracy
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ 
      message: 'Error fetching forecast data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/airquality/map
// @desc    Get air quality data for map visualization
// @access  Private
router.get('/map', auth, async (req, res) => {
  try {
    const qLat = parseFloat(req.query.lat ?? req.user?.preferences?.location?.latitude ?? '40.7128');
    const qLng = parseFloat(req.query.lng ?? req.user?.preferences?.location?.longitude ?? '-74.0060');
    const radiusKm = parseFloat(req.query.radius ?? '10');

    // Fetch recent measurements from OpenAQ to build simple points
    let results = [];
    try {
      const openaq = await fetchOpenAqMeasurements(qLat, qLng, Math.min(Math.max(radiusKm, 1), 25) * 1000);
      results = openaq.results || [];
    } catch (e) {
      // fallback to bundled sample points
      const dataPath = path.join(__dirname, '../data/airQualitySample.json');
      const rawData = await fs.readFile(dataPath, 'utf8');
      const sample = JSON.parse(rawData);
      return res.json({
        mapData: sample.mapData,
        bounds: {
          north: Math.max(...sample.mapData.map(p => p.latitude)),
          south: Math.min(...sample.mapData.map(p => p.latitude)),
          east: Math.max(...sample.mapData.map(p => p.longitude)),
          west: Math.min(...sample.mapData.map(p => p.longitude))
        },
        lastUpdated: new Date().toISOString(),
        dataSource: 'sample_fallback'
      });
    }

    // Group by location (coordinates) and take latest per parameter
    const keyFor = (m) => `${m.coordinates?.latitude},${m.coordinates?.longitude}`;
    const byLoc = new Map();
    for (const m of results) {
      if (!m.coordinates) continue;
      const key = keyFor(m);
      if (!byLoc.has(key)) byLoc.set(key, {});
      const entry = byLoc.get(key);
      const p = m.parameter?.name || m.parameter;
      entry[p] = m;
      entry._coords = m.coordinates;
    }

    const colorForAqi = (aqi) => {
      if (aqi <= 50) return '#00E400';
      if (aqi <= 100) return '#FFFF00';
      if (aqi <= 150) return '#FF8C00';
      if (aqi <= 200) return '#FF0000';
      if (aqi <= 300) return '#8F3F97';
      return '#7E0023';
    };

    const points = [];
    for (const [, entry] of byLoc.entries()) {
      const pm25 = entry.pm25?.value ?? null;
      const pm10 = entry.pm10?.value ?? null;
      const aqiPm25 = calculateAqiFromPm25(Number(pm25)).value ?? 0;
      // If PM2.5 missing, approximate using PM10 -> simple scale (not EPA-accurate but placeholder)
      const approxAqi = aqiPm25 || Math.min(Math.round((Number(pm10) || 0) * 0.5), 200);
      points.push({
        latitude: entry._coords.latitude,
        longitude: entry._coords.longitude,
        aqi: approxAqi,
        category: approxAqi <= 50 ? 'Good' : approxAqi <= 100 ? 'Moderate' : approxAqi <= 150 ? 'Unhealthy for Sensitive Groups' : approxAqi <= 200 ? 'Unhealthy' : approxAqi <= 300 ? 'Very Unhealthy' : 'Hazardous',
        pm25: pm25,
        pm10: pm10,
        color: colorForAqi(approxAqi)
      });
    }

    if (points.length === 0) {
      // fallback to sample if OpenAQ had no points
      const dataPath = path.join(__dirname, '../data/airQualitySample.json');
      const rawData = await fs.readFile(dataPath, 'utf8');
      const sample = JSON.parse(rawData);
      return res.json({
        mapData: sample.mapData,
        bounds: {
          north: Math.max(...sample.mapData.map(p => p.latitude)),
          south: Math.min(...sample.mapData.map(p => p.latitude)),
          east: Math.max(...sample.mapData.map(p => p.longitude)),
          west: Math.min(...sample.mapData.map(p => p.longitude))
        },
        lastUpdated: new Date().toISOString(),
        dataSource: 'sample_empty'
      });
    }

    res.json({
      mapData: points,
      bounds: {
        north: Math.max(...points.map(p => p.latitude)),
        south: Math.min(...points.map(p => p.latitude)),
        east: Math.max(...points.map(p => p.longitude)),
        west: Math.min(...points.map(p => p.longitude))
      },
      lastUpdated: new Date().toISOString(),
      dataSource: 'openaq_v3'
    });
  } catch (error) {
    console.error('Map data error:', error);
    res.status(500).json({ 
      message: 'Error fetching map data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @route   GET /api/airquality/alerts
// @desc    Get air quality alerts
// @access  Private
router.get('/alerts', auth, async (req, res) => {
  try {
    // TODO: Implement real alert system
    // 1. Monitor real-time data for threshold breaches
    // 2. Send notifications via email/SMS/push
    // 3. Integrate with weather alerts
    
    const dataPath = path.join(__dirname, '../data/airQualitySample.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const airQualityData = JSON.parse(rawData);
    
    // Filter alerts based on user preferences
    const userThreshold = req.user.preferences?.alertThreshold || 'unhealthy_sensitive';
    const thresholdMap = {
      'moderate': 51,
      'unhealthy_sensitive': 101,
      'unhealthy': 151,
      'very_unhealthy': 201,
      'hazardous': 301
    };
    
    const relevantAlerts = airQualityData.alerts.filter(alert => {
      // In real implementation, check against current AQI values
      return true; // For now, return all alerts
    });
    
    res.json({
      alerts: relevantAlerts,
      userThreshold,
      lastChecked: new Date().toISOString()
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ 
      message: 'Error fetching alerts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
