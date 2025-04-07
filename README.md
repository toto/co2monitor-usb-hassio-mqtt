# CO2 Monitor MQTT Bridge

This Node.js application bridges a TFA-Dostmann AirCO2ntrol Mini CO2 monitor to MQTT, making it compatible with Home Assistant through MQTT discovery.

## Features

- Connects to TFA-Dostmann AirCO2ntrol Mini CO2 monitor
- Publishes CO2 and temperature readings to MQTT
- Supports Home Assistant MQTT discovery
- Configurable through environment variables
- Automatic reconnection to MQTT broker
- Debug logging capability

## Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/co2-mqtt.git
cd co2-mqtt
```

2. Install dependencies:
```bash
npm install
```

## Configuration

The application is configured through environment variables. Copy the `.env.example` file to `.env` and modify the values as needed:

```bash
cp .env.example .env
```

### Environment Variables

- `MQTT_BROKER`: MQTT broker URL (default: `mqtt://localhost`)
- `MQTT_USERNAME`: MQTT username (optional)
- `MQTT_PASSWORD`: MQTT password (optional)
- `MQTT_TOPIC_PREFIX`: MQTT topic prefix for Home Assistant discovery (default: `homeassistant/sensor/co2_monitor`)
- `DEVICE_ID`: Unique identifier for the device (default: `co2_monitor_1`)
- `DEVICE_UUID`: Unique UUID for the device
- `DEBUG`: Enable debug logging (default: `false`)

## Usage

1. Ensure your CO2 monitor is connected to your computer
2. Start the application:
```bash
node index.js
```

The application will:
- Connect to the CO2 monitor
- Connect to the MQTT broker
- Publish Home Assistant discovery messages
- Continuously publish sensor readings

## Home Assistant Integration

The application automatically publishes Home Assistant MQTT discovery messages for:
- CO2 concentration (in ppm)
- Temperature (in °C)

These sensors will automatically appear in Home Assistant if MQTT discovery is enabled.

## Troubleshooting

- If the application fails to connect to the MQTT broker, check:
  - The broker is running
  - The broker address is correct
  - The port is correct
  - The credentials are correct (if required)
- Enable debug logging by setting `DEBUG=true` in your `.env` file
- Check the console output for error messages

## Dependencies

- `co2-monitor`: For communicating with the CO2 monitor
- `mqtt`: For MQTT communication
- `dotenv`: For loading environment variables
