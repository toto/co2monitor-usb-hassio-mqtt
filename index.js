require('dotenv').config();
const Co2Monitor = require("co2-monitor");
const mqtt = require('mqtt');

// MQTT Configuration from environment variables
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://localhost';
const MQTT_TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'homeassistant/sensor/co2_monitor';
const DEVICE_ID = process.env.DEVICE_ID || 'co2_monitor_1';
const DEVICE_UUID = process.env.DEVICE_UUID || 'co2_monitor_1';
const DEBUG = process.env.DEBUG === 'true';

// Debug logging function
function debugLog(message) {
    if (DEBUG) {
        console.info(`[DEBUG] ${message}`);
    }
}

// Create MQTT client with optional authentication
const mqttOptions = {};
if (process.env.MQTT_USERNAME) {
    mqttOptions.username = process.env.MQTT_USERNAME;
}
if (process.env.MQTT_PASSWORD) {
    mqttOptions.password = process.env.MQTT_PASSWORD;
}
mqttOptions.clientId = `co2sensor-${DEVICE_ID}`;
mqttOptions.reconnectPeriod = 5000; // Try to reconnect every 5 seconds

const mqttClient = mqtt.connect(MQTT_BROKER, mqttOptions);

// MQTT error handling
mqttClient.on('error', (error) => {
    console.error('MQTT Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
        console.error('Failed to connect to MQTT broker. Please check:');
        console.error('1. The broker is running');
        console.error('2. The broker address is correct');
        console.error('3. The port is correct');
        console.error('4. The credentials are correct (if required)');
    }
});

mqttClient.on('close', () => {
    console.warn('MQTT connection closed. Attempting to reconnect...');
});

mqttClient.on('offline', () => {
    console.warn('MQTT client is offline');
});

mqttClient.on('connect', () => {
    debugLog('Connected to MQTT broker');
    
    const device = {
        identifiers: [DEVICE_UUID],
        name: 'AirCO2ntrol Mini',
        manufacturer: 'TFA-Dostmann',
        model: 'AirCO2ntrol Mini'
    }
    // Publish Home Assistant discovery messages
    const discoveryMessages = [
        {
            topic: `${MQTT_TOPIC_PREFIX}/co2/config`,
            payload: JSON.stringify({
                name: 'CO2 Monitor CO2',
                device_class: 'carbon_dioxide',
                state_class: 'measurement',
                state_topic: `${MQTT_TOPIC_PREFIX}/state`,
                value_template: '{{ value_json.co2 | float }}',
                unit_of_measurement: 'ppm',
                unique_id: `co2_${DEVICE_UUID}`,
                device,
                device_class: "carbon_dioxide",
            })
        },
        {
            topic: `${MQTT_TOPIC_PREFIX}/temperature/config`,
            payload: JSON.stringify({
                name: 'CO2 Monitor Temperature',
                device_class: 'temperature',
                state_class: 'measurement',
                state_topic: `${MQTT_TOPIC_PREFIX}/state`,
                value_template: '{{ value_json.temperature | float }}',
                unit_of_measurement: '°C',
                unique_id: `temperature_${DEVICE_UUID}`,
                device,
                device_class: "temperature",
            })
        }
    ];

    discoveryMessages.forEach(msg => {
        mqttClient.publish(msg.topic, msg.payload, { retain: true }, (error) => {
            if (error) {
                console.error(`Failed to publish discovery message for ${msg.topic}:`, error);
            } else {
                debugLog(`Published discovery message for ${msg.topic}`);
            }
        });
    });
});

const co2Monitor = new Co2Monitor();

co2Monitor.on('connected', () => {
    debugLog('CO2 Monitor connected');
});

co2Monitor.on('disconnected', () => {
    debugLog('CO2 Monitor disconnected');
});

co2Monitor.on('error', (error) => {
    console.error('CO2 Monitor error:', error);
    co2Monitor.disconnect(() => {
        process.exit(1);
    });
});

// Store the latest values
let sensorData = {
    co2: null,
    temperature: null
};

co2Monitor.on('co2', (co2) => {
    sensorData.co2 = co2.value;
    debugLog(`CO2 value: ${co2.value} ppm`);
    publishSensorData();
});

co2Monitor.on('temperature', (temperature) => {
    sensorData.temperature = temperature.value;
    debugLog(`Temperature value: ${temperature.value} °C`);
    publishSensorData();
});

function publishSensorData() {
    // Only publish if we have all values
    if (sensorData.co2 !== null && sensorData.temperature !== null) {
        const payload = JSON.stringify(sensorData);
        mqttClient.publish(
            `${MQTT_TOPIC_PREFIX}/state`,
            payload,
            { retain: true }
        );
        debugLog(`Published sensor data: ${payload}`);
    }
}

co2Monitor.connect((error) => {
    if (error) {
        console.error('Failed to connect to CO2 Monitor:', error);
        process.exit(1);
    }

    co2Monitor.startTransfer((error) => {
        if (error) {
            console.error('Failed to start data transfer:', error);
        }
    });
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('Received SIGINT. Cleaning up...');
    cleanupAndExit();
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM. Cleaning up...');
    cleanupAndExit();
});

function cleanupAndExit() {
    // Disconnect from MQTT
    mqttClient.end(() => {
        console.log('MQTT client disconnected');
        
        // Disconnect from CO2 monitor
        co2Monitor.disconnect(() => {
            console.log('CO2 monitor disconnected');
            process.exit(0);
        });
    });
}