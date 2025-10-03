# CleanSkies Live 🌍

A full-stack web application for real-time air quality monitoring and forecasting. Built with React, Node.js, Express, MongoDB, and integrated with NASA TEMPO data, ground-based AQI monitoring, and Arduino sensor feeds.

## 🚀 Features

- **Real-time Air Quality Monitoring**: Interactive map with live air quality data
- **User Authentication**: Secure JWT-based authentication system
- **Personalized Alerts**: Health-based air quality recommendations
- **6-Hour Forecasting**: Time-series predictions for air quality
- **Multi-source Data**: NASA TEMPO, ground AQI, weather, and Arduino sensors
- **Responsive Design**: Clean NASA-inspired UI with Tailwind CSS
- **Docker Support**: Easy deployment with Docker Compose

## 🏗️ Architecture

```
cleanskies-live/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React context providers
│   │   ├── pages/          # Page components
│   │   └── App.js
│   ├── package.json
│   └── Dockerfile
├── server/                 # Node.js backend
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── data/               # Sample data files
│   ├── scripts/            # Database scripts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Docker orchestration
├── nginx.conf             # Reverse proxy config
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **Mapbox GL JS** - Interactive maps
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy
- **MongoDB** - Database container

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- MongoDB (for local development)
- Mapbox account and access token

### 1. Clone and Setup

```bash
git clone <repository-url>
cd cleanskies-live
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env.example .env
```

Edit `.env` with your configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/cleanskies-live

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Mapbox Configuration
REACT_APP_MAPBOX_TOKEN=your-mapbox-access-token

# API Keys (for future implementation)
NASA_API_KEY=your-nasa-api-key
WEATHER_API_KEY=your-openweather-api-key
```

### 3. Run with Docker (Recommended)

```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- MongoDB: localhost:27017

### 4. Run Locally (Development)

#### Backend Setup

```bash
cd server
npm install
npm run dev
```

#### Frontend Setup

```bash
cd client
npm install
npm start
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Air Quality
- `GET /api/airquality/current` - Current air quality data
- `GET /api/airquality/forecast` - 6-hour forecast
- `GET /api/airquality/map` - Map data for visualization
- `GET /api/airquality/alerts` - Air quality alerts

### User Management
- `PUT /api/user/profile` - Update user profile
- `DELETE /api/user/account` - Delete user account

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  healthData: {
    age: Number,
    conditions: [String],
    sensitivity: String
  },
  preferences: {
    alertsEnabled: Boolean,
    alertThreshold: String,
    location: {
      latitude: Number,
      longitude: Number,
      city: String,
      state: String,
      country: String
    }
  },
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Configuration

### Mapbox Setup

1. Create a Mapbox account at [mapbox.com](https://mapbox.com)
2. Generate an access token
3. Add the token to your `.env` file as `REACT_APP_MAPBOX_TOKEN`

### MongoDB Setup

For local development, ensure MongoDB is running on port 27017. For production, use MongoDB Atlas or a managed MongoDB service.

## 🚀 Deployment

### Production Deployment

1. **Environment Variables**: Update all environment variables for production
2. **SSL Certificates**: Add SSL certificates to `./ssl/` directory
3. **Database**: Use a production MongoDB instance
4. **Docker Compose**: Use the production profile

```bash
# Run with production configuration
docker-compose --profile production up -d
```

### Environment-Specific Configurations

- **Development**: Uses local MongoDB, debug logging
- **Production**: Uses production MongoDB, optimized builds, SSL

## 🔌 API Integration Points

The application is designed to integrate with real APIs. Replace placeholder data in:

### NASA TEMPO API
- **File**: `server/routes/airQuality.js`
- **Endpoint**: NASA TEMPO API for NO2 column density
- **Implementation**: Replace placeholder data with real API calls

### Ground AQI Data
- **File**: `server/routes/airQuality.js`
- **Endpoint**: EPA AirNow API or local monitoring stations
- **Implementation**: Add real AQI data fetching

### Weather Data
- **File**: `server/routes/airQuality.js`
- **Endpoint**: OpenWeatherMap API
- **Implementation**: Replace weather placeholder with real data

### Arduino Sensors
- **File**: `server/routes/airQuality.js`
- **Endpoint**: Local Arduino sensor network
- **Implementation**: Add real-time sensor data collection

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

## 📝 Development Notes

### Adding New Features

1. **Backend**: Add routes in `server/routes/`, models in `server/models/`
2. **Frontend**: Add components in `client/src/components/`, pages in `client/src/pages/`
3. **Database**: Update models and run migrations
4. **API**: Update API documentation

### Code Structure

- **Components**: Reusable UI components
- **Contexts**: Global state management
- **Pages**: Route-specific components
- **Utils**: Helper functions and utilities

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection**: Ensure MongoDB is running and accessible
2. **Mapbox Token**: Verify Mapbox token is valid and has proper permissions
3. **CORS Issues**: Check CORS configuration in server
4. **Docker Issues**: Ensure Docker and Docker Compose are properly installed

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- NASA for TEMPO satellite data
- EPA for air quality standards
- Mapbox for mapping services
- OpenWeatherMap for weather data
- The open-source community

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**CleanSkies Live** - Monitoring air quality for a healthier tomorrow 🌍✨
