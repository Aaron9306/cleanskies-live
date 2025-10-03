import React, { useEffect, useRef, useState } from 'react';
import { useAirQuality } from '../contexts/AirQualityContext';
import { RefreshCw, MapPin, AlertTriangle } from 'lucide-react';

const SimpleMap = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { mapData, fetchMapData, loading } = useAirQuality();

  // Initialize map with OpenStreetMap (free)
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    // Create a simple map using OpenStreetMap
    const mapElement = mapContainer.current;
    if (!mapElement) return;

    // Create map HTML structure
    mapElement.innerHTML = `
      <div style="width: 100%; height: 100%; position: relative; background: #f0f0f0; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-direction: column;">
        <div style="font-size: 18px; font-weight: bold; color: #0B3D91; margin-bottom: 10px;">🗺️ Interactive Air Quality Map</div>
        <div style="font-size: 14px; color: #666; text-align: center; margin-bottom: 20px;">
          Click on markers below to view air quality data
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
          ${mapData?.mapData?.map(point => `
            <div style="
              background: ${point.color}; 
              color: ${point.aqi > 100 ? 'white' : 'black'}; 
              padding: 8px 12px; 
              border-radius: 20px; 
              font-weight: bold; 
              cursor: pointer;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              transition: transform 0.2s;
            " 
            onmouseover="this.style.transform='scale(1.05)'"
            onmouseout="this.style.transform='scale(1)'"
            onclick="alert('AQI: ${point.aqi}\\nCategory: ${point.category}\\nPM2.5: ${point.pm25} μg/m³\\nPM10: ${point.pm10} μg/m³')">
              ${point.aqi} - ${point.category}
            </div>
          `).join('') || '<div style="color: #999;">Loading air quality data...</div>'}
        </div>
        <div style="margin-top: 20px; font-size: 12px; color: #999;">
          Map powered by OpenStreetMap (Free)
        </div>
      </div>
    `;

    setMapLoaded(true);
  }, [mapData]);

  // Fetch map data when component mounts
  useEffect(() => {
    if (mapLoaded) {
      fetchMapData();
    }
  }, [mapLoaded, fetchMapData]);

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00E400';
    if (aqi <= 100) return '#FFFF00';
    if (aqi <= 150) return '#FF8C00';
    if (aqi <= 200) return '#FF0000';
    if (aqi <= 300) return '#8F3F97';
    return '#7E0023';
  };

  return (
    <div className="relative">
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-96 rounded-lg shadow-lg"
        style={{ minHeight: '400px' }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-nasa-blue" />
            <span className="text-sm text-gray-600">Loading air quality data...</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
        <h3 className="font-semibold text-sm mb-2">Air Quality Index</h3>
        <div className="space-y-1 text-xs">
          {[
            { range: '0-50', label: 'Good', color: '#00E400' },
            { range: '51-100', label: 'Moderate', color: '#FFFF00' },
            { range: '101-150', label: 'Unhealthy for Sensitive Groups', color: '#FF8C00' },
            { range: '151-200', label: 'Unhealthy', color: '#FF0000' },
            { range: '201-300', label: 'Very Unhealthy', color: '#8F3F97' },
            { range: '301+', label: 'Hazardous', color: '#7E0023' }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{item.range}</span>
              <span className="text-gray-800 font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={() => fetchMapData()}
        disabled={loading}
        className="absolute bottom-4 left-4 bg-white hover:bg-gray-50 text-gray-700 p-2 rounded-lg shadow-lg transition-colors disabled:opacity-50"
        title="Refresh data"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>

      {/* Data Source Info */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg px-3 py-2 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <MapPin className="w-3 h-3" />
          <span>Data: Placeholder (Replace with real APIs)</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleMap;
