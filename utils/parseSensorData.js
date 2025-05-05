/**
 * Parses raw sensor data string into structured data object
 * @param {string} raw - The raw data string from the ESP32 device
 * @returns {{ acc?: {x: number, y: number, z: number}, gyro?: {x: number, y: number, z: number} }}
 */
const parseSensorData = (raw: string): { 
  acc?: {x: number, y: number, z: number}, 
  gyro?: {x: number, y: number, z: number} 
} => {
  try {
    const data: { 
      acc?: {x: number, y: number, z: number}, 
      gyro?: {x: number, y: number, z: number} 
    } = {};

    const accMatch = raw.match(/Acc\[X,Y,Z\]:([-.\d]+),([-.\d]+),([-.\d]+)/);
    const gyroMatch = raw.match(/Gyro\[X,Y,Z\]:([-.\d]+),([-.\d]+),([-.\d]+)/);

    if (accMatch) {
      data.acc = {
        x: parseFloat(accMatch[1]),
        y: parseFloat(accMatch[2]),
        z: parseFloat(accMatch[3]),
      };
    }

    if (gyroMatch) {
      data.gyro = {
        x: parseFloat(gyroMatch[1]),
        y: parseFloat(gyroMatch[2]),
        z: parseFloat(gyroMatch[3]),
      };
    }

    return data;
  } catch (err) {
    console.warn('Failed to parse sensor data:', err);
    return {};
  }
};

export default parseSensorData;