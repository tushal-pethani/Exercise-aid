# ESP32 Bluetooth Motion Visualization

This project has been enhanced with 2D motion visualizations for ESP32 sensor data. The app now displays two types of gauges:

1. **Angle Gauge** - Displays the tilt angle of the device with a threshold indicator
2. **Momentum Gauge** - Shows the momentum/movement detected by the accelerometer

## Features

- Real-time visualization of accelerometer and gyroscope data
- Angle gauge with configurable threshold (currently set to 90°)
- Momentum visualization that shows vertical movement
- Warning indicators (red dots) that appear when exceeding thresholds
- Modern, clean UI with a black background and high-contrast elements

## Implementation Details

The visualization is implemented using React Native SVG, which provides excellent performance for 2D graphics. The app connects to an ESP32 device via Bluetooth and parses the accelerometer and gyroscope data to drive the visualizations.

### Angle Gauge

The angle gauge uses accelerometer data to calculate pitch and roll angles. It displays:
- A circular gauge with tick marks
- A white threshold indicator line
- A green indicator showing the current angle
- Red warning markers when exceeding threshold angles

### Momentum Gauge

The momentum gauge visualizes vertical movement based on Y-axis acceleration. It displays:
- A semi-circular gauge
- A green indicator showing the current momentum
- Red warning markers when momentum exceeds safe levels

## How to Run

1. Make sure you have all required React Native dependencies installed
2. Connect your device or start an emulator 
3. Run the app:

```bash
npm install
# For iOS
npx pod-install ios  # if you've made changes to native dependencies
npx react-native run-ios

# For Android 
npx react-native run-android
```

## ESP32 Device Requirements

The app expects to connect to an ESP32 device with the following characteristics:
- Device name: "ESP32-MPU6050"
- Service UUID: "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
- Characteristic UUID: "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
- Data format: Text strings containing "Acc[X,Y,Z]:" and "Gyro[X,Y,Z]:" values

## Customization

You can customize the visualization by modifying the `thresholdAngle` prop in the AngleGauge component or adjusting the scaling factors in the gauge components. 