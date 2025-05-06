# EXERCISE AID Mobile App

A React Native application that connects to ESP32 Bluetooth devices for motion tracking, angle measurements, and exercise assistance.

## Overview

Exercise Aid is a mobile application designed to help clients perform exercises correctly by monitoring their movements via ESP32 Bluetooth sensors. The app supports both client and physiotherapist roles, enabling personalized exercise prescription and monitoring.

## Features

### Authentication
- Email/password-based login and registration
- Role selection (client or physiotherapist)
- User profile management

### Client Features
- **Home Screen**: Navigation to custom tasks or assigned exercises
- **Custom Exercise Task**:
  - Select body part (Shoulder, Arm, Leg, Back)
  - Choose specific exercises for the selected body part
  - Configure sets, reps, target angle, and rest time
- **Assigned Exercises**:
  - View exercises assigned by connected physiotherapists
  - Filter by status (all, pending, completed)
  - Track progress and completion status
- **Bluetooth Device Connection**:
  - Connect to ESP32 device for real-time motion tracking
  - Calibrate and monitor exercise angles
- **Exercise Feedback**:
  - Real-time angle and velocity measurements
  - Warnings for deviations (>10° from target angle)
  - Warnings for excessive velocity (>30°/s)
  - Performance summary after completion

### Physiotherapist Features
- **Dashboard**: Overview of connected clients and activity
- **Client Management**: View and manage client list
- **Exercise Creation**: Create custom exercises for clients

### Common Features
- **Connections**: Manage connections between clients and physiotherapists
- **Profile**: View and edit personal information
- **Settings**: Configure app preferences
- **3D Visualization**: Visualize movement in real-time (when connected to device)

## Technical Architecture

### Frontend
- React Native for cross-platform mobile development
- React Navigation for app navigation (drawer, stack, and tab navigation)
- BLE-PLX for Bluetooth Low Energy connectivity
- Context API for state management

### Backend
- Node.js server with Express
- MongoDB database for user and exercise data storage
- JWT-based authentication

### Data Models
- **User**: Stores user information, including role (client/physio)
- **Exercise**: Defines exercise configurations and relationships
- **ExerciseSession**: Records exercise performance and metrics
- **Connection**: Manages client-physiotherapist relationships

## Getting Started

### Prerequisites
- Node.js (v14+)
- React Native development environment
- ESP32 device with motion sensors (for full functionality)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Esp32BluetoothApp.git
   cd Esp32BluetoothApp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. For iOS, install pods:
   ```
   cd ios && pod install && cd ..
   ```

4. Add required image assets in the `assets/images` directory:
   - background.jpg
   - exercise_banner.jpg
   - physio_banner.jpg
   - lateral_raise.jpg
   - bicep_curl.jpg
   - squat.jpg

### Running the App

#### iOS
```
npm run ios
```

#### Android
```
npm run android
```

## Future Enhancements

- Chat functionality between clients and physiotherapists
- Video guides for exercises
- Analytics dashboard for progress tracking
- Integration with health apps
- Cloud synchronization for offline use

## License

This project is licensed under the MIT License - see the LICENSE file for details.
