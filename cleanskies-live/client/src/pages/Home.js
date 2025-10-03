import React, { useEffect } from 'react';
import { useAirQuality } from '../contexts/AirQualityContext';
import AirQualityMap from '../components/AirQualityMap';
import AirQualityCard from '../components/AirQualityCard';
import { RefreshCw, AlertTriangle, Cloud } from 'lucide-react';

const Home = () => {
  const { 
    currentData, 
    forecast, 
    alerts, 
    loading, 
    fetchCurrentData, 
    fetchForecast, 
    fetchAlerts,
    refreshAllData 
  } = useAirQuality();

  useEffect(() => {
    // Fetch initial data
    fetchCurrentData();
    fetchForecast();
    fetchAlerts();
  }, [fetchCurrentData, fetchForecast, fetchAlerts]);

  const handleRefresh = () => {
    refreshAllData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 font-nasa">
            Air Quality Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time air quality monitoring and forecasting
          </p>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="btn-primary flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Alerts Banner */}
      {alerts && alerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <div className="font-medium text-red-800">
                {alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}
              </div>
              <div className="text-sm text-red-700">
                Check the air quality data below for details
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="lg:col-span-1">
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <Cloud className="w-5 h-5 text-nasa-blue mr-2" />
                Interactive Air Quality Map
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Click on markers to view detailed air quality information
              </p>
            </div>
            <AirQualityMap />
          </div>
        </div>

        {/* Air Quality Data */}
        <div className="lg:col-span-1">
          <AirQualityCard 
            data={currentData} 
            forecast={forecast} 
            alerts={alerts} 
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && !currentData && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-nasa-blue mx-auto mb-4" />
            <div className="text-gray-600">Loading air quality data...</div>
          </div>
        </div>
      )}

      {/* No Data State */}
      {!loading && !currentData && (
        <div className="text-center py-12">
          <Cloud className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <div className="text-xl font-medium text-gray-600 mb-2">
            No air quality data available
          </div>
          <div className="text-gray-500 mb-4">
            Unable to fetch current air quality information
          </div>
          <button onClick={handleRefresh} className="btn-primary">
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
