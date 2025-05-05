# PhysioConnect App

A React Native application for physiotherapists and patients to connect, monitor, and track physical therapy exercises using motion sensors on ESP32 devices.

## Features

- **User Authentication** - Register and login as either a patient or physiotherapist
- **Connection Management** - Send, accept, or decline connection requests between patients and therapists
- **Exercise Monitoring** - Real-time tracking of exercises using ESP32 Bluetooth sensors
- **Angle Measurement** - Visual display of joint angles during exercises
- **Calibration** - Reset angle measurements to zero for accurate readings
- **Exercise History** - Track and review past exercise sessions
- **Role-Based System** - Different features and views for patients vs physiotherapists

## Tech Stack

- React Native
- MongoDB
- Express.js
- Node.js
- Bluetooth Low Energy (BLE)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Xcode (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository
2. Install dependencies:
```
cd Esp32BluetoothApp
npm install
```

3. Create a `.env` file in the root directory with:
```
MONGODB_URI=mongodb://localhost:27017/physiotherapy
JWT_SECRET=your_jwt_secret_key_here
API_URL=http://localhost:5000/api
```

4. Start the MongoDB server
5. Start the backend server:
```
npm run server
```

6. Run the app on iOS or Android:
```
npm run ios
# or
npm run android
```

## ESP32 Sensor Setup

The app works with ESP32 devices running firmware that sends accelerometer and gyroscope data over Bluetooth Low Energy (BLE). The sensor data should be formatted as follows:

- Service UUID: `6e400001-b5a3-f393-e0a9-e50e24dcca9e`
- Characteristic UUID: `6e400003-b5a3-f393-e0a9-e50e24dcca9e`

## Usage

1. Register as either a patient or physiotherapist
2. Log in to the app
3. If you're a physiotherapist, find patients using the "Find Connections" feature
4. Send connection requests to patients
5. Once connected, access the exercise monitoring features
6. Connect to an ESP32 device to begin tracking exercises
7. Use the calibration button to reset angle measurements when needed
8. Track progress and monitor exercise form in real-time

## Color Scheme

The app uses the following color scheme:
- Primary: `#C4DB93`
- Secondary: `#32AD5E`
- Background: `#EFEDE2`
- Text: `#000000`

## License

MIT
