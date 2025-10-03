import React from 'react';
import { 
  Wind, 
  Droplets, 
  Thermometer, 
  Eye, 
  Sun, 
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react';

const AirQualityCard = ({ data, forecast, alerts }) => {
  if (!data) return null;

  const getAQIColor = (aqi) => {
    if (aqi <= 50) return 'aqi-good';
    if (aqi <= 100) return 'aqi-moderate';
    if (aqi <= 150) return 'aqi-unhealthy-sensitive';
    if (aqi <= 200) return 'aqi-unhealthy';
    if (aqi <= 300) return 'aqi-very-unhealthy';
    return 'aqi-hazardous';
  };

  const getAQIIcon = (aqi) => {
    if (aqi <= 50) return '😊';
    if (aqi <= 100) return '😐';
    if (aqi <= 150) return '😷';
    if (aqi <= 200) return '😰';
    if (aqi <= 300) return '😱';
    return '☠️';
  };

  return (
    <div className="space-y-6">
      {/* Current AQI */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Current Air Quality</h2>
          <div className="text-sm text-gray-500">
            {new Date(data.timestamp).toLocaleTimeString()}
          </div>
        </div>
        
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full text-white text-2xl font-bold ${getAQIColor(data.aqi.value)}`}>
            {data.aqi.value}
          </div>
          <div className="mt-2">
            <div className="text-lg font-semibold text-gray-800">
              {data.aqi.category}
            </div>
            <div className="text-2xl">{getAQIIcon(data.aqi.value)}</div>
          </div>
        </div>

        <p className="text-sm text-gray-600 text-center">
          {data.aqi.description}
        </p>
      </div>

      {/* Pollutants */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pollutants</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(data.pollutants).map(([key, pollutant]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-600 uppercase">
                {key.toUpperCase()}
              </div>
              <div className="text-lg font-bold text-gray-800">
                {pollutant.value} {pollutant.unit}
              </div>
              <div className="text-xs text-gray-500">
                {pollutant.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weather */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weather Conditions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Thermometer className="w-5 h-5 text-red-500" />
            <div>
              <div className="text-sm text-gray-600">Temperature</div>
              <div className="font-semibold">{data.weather.temperature}°C</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-sm text-gray-600">Humidity</div>
              <div className="font-semibold">{data.weather.humidity}%</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Wind className="w-5 h-5 text-gray-500" />
            <div>
              <div className="text-sm text-gray-600">Wind Speed</div>
              <div className="font-semibold">{data.weather.windSpeed} m/s</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-green-500" />
            <div>
              <div className="text-sm text-gray-600">Visibility</div>
              <div className="font-semibold">{data.weather.visibility} km</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Sun className="w-5 h-5 text-yellow-500" />
            <div>
              <div className="text-sm text-gray-600">UV Index</div>
              <div className="font-semibold">{data.weather.uvIndex}</div>
            </div>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {data.weather.description}
          </div>
        </div>
      </div>

      {/* Forecast */}
      {forecast && forecast.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">6-Hour Forecast</h3>
          <div className="space-y-3">
            {forecast.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {new Date(item.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="text-xs text-gray-600">
                      Confidence: {Math.round(item.confidence * 100)}%
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getAQIColor(item.aqi.value)}`}>
                    {item.aqi.value}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-800">
                      {item.aqi.category}
                    </div>
                    <div className="text-xs text-gray-600">
                      PM2.5: {item.pm25} μg/m³
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            Air Quality Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium text-red-800 mb-1">
                      {alert.title}
                    </div>
                    <div className="text-sm text-red-700 mb-2">
                      {alert.message}
                    </div>
                    {alert.recommendations && (
                      <div className="text-xs text-red-600">
                        <div className="font-medium mb-1">Recommendations:</div>
                        <ul className="list-disc list-inside space-y-1">
                          {alert.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Source Info */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="text-sm text-blue-800">
          <div className="font-medium mb-1">Data Sources:</div>
          <div className="space-y-1">
            <div>• NASA TEMPO: Placeholder data (replace with real API)</div>
            <div>• Ground AQI: Placeholder data (replace with EPA API)</div>
            <div>• Weather: Placeholder data (replace with OpenWeatherMap)</div>
            <div>• Arduino Sensors: Placeholder data (replace with local network)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirQualityCard;
