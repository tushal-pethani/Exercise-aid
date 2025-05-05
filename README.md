# ESP32 Bluetooth Motion Visualization App

This React Native application connects to ESP32 devices with MPU6050 sensors and provides beautiful visualizations of the accelerometer and gyroscope data.

## Features

- **Device Scanning UI**: Discover and connect to nearby ESP32-MPU6050 devices
- **Angle Gauge**: Visualize the device tilt angle with threshold indicators
- **Momentum Gauge**: Display the device momentum based on accelerometer data
- **Real-time Data Updates**: View sensor data in real-time with smooth animations
- **Device Connection Management**: Connect and disconnect from devices with a clean UI

## Screenshots

### Device Scanning Screen
- Discovers nearby Bluetooth devices
- Highlights compatible ESP32-MPU6050 devices
- Provides a simple connection interface

### Visualization Screen
- Clear visualization of sensor data using gauges
- Real-time display of accelerometer and gyroscope readings
- Easy disconnect button to return to scanning

## How to Use

1. Launch the app
2. The app will automatically scan for nearby Bluetooth devices
3. Compatible ESP32-MPU6050 devices will be highlighted in green
4. Tap on a device to connect
5. Once connected, you'll see real-time visualizations of the device's motion
6. Tap "Disconnect" to return to the scanning screen

## ESP32 Device Requirements

The app is designed to work with ESP32 devices that:
- Have the device name "ESP32-MPU6050"
- Use Service UUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
- Use Characteristic UUID: "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
- Send data in the format: "Acc[X,Y,Z]:x,y,z Gyro[X,Y,Z]:x,y,z"

## Installation

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
cd Esp32BluetoothApp
npm install

# For iOS
cd ios && pod install && cd ..
npx react-native run-ios

# For Android
npx react-native run-android
```

## Permissions

The app requires the following permissions:
- Bluetooth permissions (automatically requested on iOS)
- Location permissions on Android (required for Bluetooth scanning)

## Technical Details

- Built with React Native
- Uses react-native-ble-plx for Bluetooth connectivity
- Visualizations created with react-native-svg
- Clean code architecture with separate components for scanning and visualization

This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
