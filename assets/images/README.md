# App Images

This folder contains the application logo and other images used throughout the app.

## Logo

- **logo.svg** - Vector version of the app logo 
- **logo.png** - PNG version of the app logo (512x512px) for use in the app

The logo represents the PhysioConnect app with the following elements:
- Green and light green colors representing health and wellness
- A stylized "P" for "PhysioConnect"
- Motion lines representing physical movement and exercise
- Leaf-like shape representing growth and healing

## Usage

To use the logo in React Native components:

```jsx
<Image
  source={require('../../assets/images/logo.png')}
  style={{ width: 120, height: 120 }}
  resizeMode="contain"
/>
``` 