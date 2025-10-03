import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Save, AlertTriangle, MapPin, Heart, Settings } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    healthData: {
      age: '',
      conditions: [],
      sensitivity: 'medium'
    },
    preferences: {
      alertsEnabled: true,
      alertThreshold: 'unhealthy_sensitive',
      location: {
        latitude: '',
        longitude: '',
        city: '',
        state: '',
        country: ''
      }
    }
  });

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        healthData: {
          age: user.healthData?.age || '',
          conditions: user.healthData?.conditions || [],
          sensitivity: user.healthData?.sensitivity || 'medium'
        },
        preferences: {
          alertsEnabled: user.preferences?.alertsEnabled ?? true,
          alertThreshold: user.preferences?.alertThreshold || 'unhealthy_sensitive',
          location: {
            latitude: user.preferences?.location?.latitude || '',
            longitude: user.preferences?.location?.longitude || '',
            city: user.preferences?.location?.city || '',
            state: user.preferences?.location?.state || '',
            country: user.preferences?.location?.country || ''
          }
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (name === 'conditions') {
      const condition = value;
      setFormData(prev => ({
        ...prev,
        healthData: {
          ...prev.healthData,
          conditions: prev.healthData.conditions.includes(condition)
            ? prev.healthData.conditions.filter(c => c !== condition)
            : [...prev.healthData.conditions, condition]
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Clean up form data
      const cleanedData = {
        ...formData,
        healthData: {
          ...formData.healthData,
          age: formData.healthData.age ? parseInt(formData.healthData.age) : undefined,
          conditions: formData.healthData.conditions.filter(c => c)
        },
        preferences: {
          ...formData.preferences,
          location: {
            ...formData.preferences.location,
            latitude: formData.preferences.location.latitude ? parseFloat(formData.preferences.location.latitude) : undefined,
            longitude: formData.preferences.location.longitude ? parseFloat(formData.preferences.location.longitude) : undefined
          }
        }
      };

      const response = await axios.put('/api/user/profile', cleanedData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const healthConditions = [
    { value: 'asthma', label: 'Asthma' },
    { value: 'copd', label: 'COPD' },
    { value: 'heart_disease', label: 'Heart Disease' },
    { value: 'diabetes', label: 'Diabetes' },
    { value: 'allergies', label: 'Allergies' },
    { value: 'other', label: 'Other' }
  ];

  const alertThresholds = [
    { value: 'moderate', label: 'Moderate (AQI 51-100)' },
    { value: 'unhealthy_sensitive', label: 'Unhealthy for Sensitive Groups (AQI 101-150)' },
    { value: 'unhealthy', label: 'Unhealthy (AQI 151-200)' },
    { value: 'very_unhealthy', label: 'Very Unhealthy (AQI 201-300)' },
    { value: 'hazardous', label: 'Hazardous (AQI 301+)' }
  ];

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nasa-blue"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-nasa-blue rounded-lg flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 font-nasa">Profile Settings</h1>
          <p className="text-gray-600">Manage your account and health preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <User className="w-5 h-5 text-nasa-blue mr-2" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="input-field bg-gray-100 text-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Health Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Heart className="w-5 h-5 text-red-500 mr-2" />
            Health Information
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            This information helps us provide personalized air quality recommendations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="healthData.age" className="block text-sm font-medium text-gray-700 mb-1">
                Age (optional)
              </label>
              <input
                type="number"
                id="healthData.age"
                name="healthData.age"
                value={formData.healthData.age}
                onChange={handleChange}
                min="0"
                max="120"
                className="input-field"
              />
            </div>
            
            <div>
              <label htmlFor="healthData.sensitivity" className="block text-sm font-medium text-gray-700 mb-1">
                Air Quality Sensitivity
              </label>
              <select
                id="healthData.sensitivity"
                name="healthData.sensitivity"
                value={formData.healthData.sensitivity}
                onChange={handleChange}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Health Conditions (select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {healthConditions.map(condition => (
                <label key={condition.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="conditions"
                    value={condition.value}
                    checked={formData.healthData.conditions.includes(condition.value)}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-nasa-blue focus:ring-nasa-blue"
                  />
                  <span className="text-sm text-gray-700">{condition.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Alert Preferences */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mr-2" />
            Alert Preferences
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="preferences.alertsEnabled"
                name="preferences.alertsEnabled"
                checked={formData.preferences.alertsEnabled}
                onChange={handleChange}
                className="rounded border-gray-300 text-nasa-blue focus:ring-nasa-blue"
              />
              <label htmlFor="preferences.alertsEnabled" className="text-sm font-medium text-gray-700">
                Enable air quality alerts
              </label>
            </div>
            
            <div>
              <label htmlFor="preferences.alertThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                Alert Threshold
              </label>
              <select
                id="preferences.alertThreshold"
                name="preferences.alertThreshold"
                value={formData.preferences.alertThreshold}
                onChange={handleChange}
                className="input-field"
              >
                {alertThresholds.map(threshold => (
                  <option key={threshold.value} value={threshold.value}>
                    {threshold.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Location Preferences */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 text-green-500 mr-2" />
            Location Preferences
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Set your location for more accurate air quality data and alerts.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="preferences.location.city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="preferences.location.city"
                name="preferences.location.city"
                value={formData.preferences.location.city}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter city name"
              />
            </div>
            
            <div>
              <label htmlFor="preferences.location.state" className="block text-sm font-medium text-gray-700 mb-1">
                State/Province
              </label>
              <input
                type="text"
                id="preferences.location.state"
                name="preferences.location.state"
                value={formData.preferences.location.state}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter state or province"
              />
            </div>
            
            <div>
              <label htmlFor="preferences.location.country" className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                id="preferences.location.country"
                name="preferences.location.country"
                value={formData.preferences.location.country}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter country"
              />
            </div>
            
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500">
                Note: Latitude and longitude will be automatically determined based on your city, state, and country.
                For more precise location, you can manually enter coordinates.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
