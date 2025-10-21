class Device {
  constructor(deviceId, temperature, humidity, lastUpdated, status, battery) {
    this.deviceId = deviceId;
    this.temperature = temperature;
    this.humidity = humidity;
    this.lastUpdated = lastUpdated;
    this.status = status;
    this.battery = battery;
  }
}

export default Device;
