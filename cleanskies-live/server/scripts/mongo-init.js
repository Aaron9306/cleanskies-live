// MongoDB initialization script
db = db.getSiblingDB('cleanskies-live');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: {
          bsonType: 'string',
          minLength: 2,
          maxLength: 50
        },
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        },
        password: {
          bsonType: 'string',
          minLength: 6
        },
        healthData: {
          bsonType: 'object',
          properties: {
            age: {
              bsonType: 'int',
              minimum: 0,
              maximum: 120
            },
            conditions: {
              bsonType: 'array',
              items: {
                bsonType: 'string',
                enum: ['asthma', 'copd', 'heart_disease', 'diabetes', 'allergies', 'other']
              }
            },
            sensitivity: {
              bsonType: 'string',
              enum: ['low', 'medium', 'high']
            }
          }
        },
        preferences: {
          bsonType: 'object',
          properties: {
            alertsEnabled: {
              bsonType: 'bool'
            },
            alertThreshold: {
              bsonType: 'string',
              enum: ['moderate', 'unhealthy_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous']
            },
            location: {
              bsonType: 'object',
              properties: {
                latitude: {
                  bsonType: 'double',
                  minimum: -90,
                  maximum: 90
                },
                longitude: {
                  bsonType: 'double',
                  minimum: -180,
                  maximum: 180
                },
                city: {
                  bsonType: 'string'
                },
                state: {
                  bsonType: 'string'
                },
                country: {
                  bsonType: 'string'
                }
              }
            }
          }
        }
      }
    }
  }
});

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ lastLogin: 1 });

print('Database initialized successfully');
