import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AirQualityContext = createContext();

const airQualityReducer = (state, action) => {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_CURRENT_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        currentData: action.payload,
        error: null 
      };
    case 'FETCH_FORECAST_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        forecast: action.payload,
        error: null 
      };
    case 'FETCH_MAP_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        mapData: action.payload,
        error: null 
      };
    case 'FETCH_ALERTS_SUCCESS':
      return { 
        ...state, 
        loading: false, 
        alerts: action.payload,
        error: null 
      };
    case 'FETCH_FAILURE':
      return { 
        ...state, 
        loading: false, 
        error: action.payload 
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  currentData: null,
  forecast: null,
  mapData: null,
  alerts: null,
  loading: false,
  error: null
};

export const AirQualityProvider = ({ children }) => {
  const [state, dispatch] = useReducer(airQualityReducer, initialState);

  const fetchCurrentData = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const response = await axios.get('/api/airquality/current');
      dispatch({
        type: 'FETCH_CURRENT_SUCCESS',
        payload: response.data.currentData
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch air quality data';
      dispatch({
        type: 'FETCH_FAILURE',
        payload: message
      });
      toast.error(message);
    }
  };

  const fetchForecast = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const response = await axios.get('/api/airquality/forecast');
      dispatch({
        type: 'FETCH_FORECAST_SUCCESS',
        payload: response.data.forecast
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch forecast data';
      dispatch({
        type: 'FETCH_FAILURE',
        payload: message
      });
      toast.error(message);
    }
  };

  const fetchMapData = async (lat, lng, radius) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const params = new URLSearchParams();
      if (lat) params.append('lat', lat);
      if (lng) params.append('lng', lng);
      if (radius) params.append('radius', radius);
      
      const response = await axios.get(`/api/airquality/map?${params}`);
      dispatch({
        type: 'FETCH_MAP_SUCCESS',
        payload: response.data
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch map data';
      dispatch({
        type: 'FETCH_FAILURE',
        payload: message
      });
      toast.error(message);
    }
  };

  const fetchAlerts = async () => {
    dispatch({ type: 'FETCH_START' });
    try {
      const response = await axios.get('/api/airquality/alerts');
      dispatch({
        type: 'FETCH_ALERTS_SUCCESS',
        payload: response.data.alerts
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch alerts';
      dispatch({
        type: 'FETCH_FAILURE',
        payload: message
      });
      toast.error(message);
    }
  };

  const refreshAllData = async () => {
    await Promise.all([
      fetchCurrentData(),
      fetchForecast(),
      fetchMapData(),
      fetchAlerts()
    ]);
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.currentData) {
        fetchCurrentData();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.currentData]);

  const value = {
    ...state,
    fetchCurrentData,
    fetchForecast,
    fetchMapData,
    fetchAlerts,
    refreshAllData,
    clearError
  };

  return (
    <AirQualityContext.Provider value={value}>
      {children}
    </AirQualityContext.Provider>
  );
};

export const useAirQuality = () => {
  const context = useContext(AirQualityContext);
  if (!context) {
    throw new Error('useAirQuality must be used within an AirQualityProvider');
  }
  return context;
};
