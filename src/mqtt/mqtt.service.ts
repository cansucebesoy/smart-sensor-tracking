import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { InfluxService } from 'src/influx/influx.service';
import { SensorData } from 'src/influx/interface/sensor-data.interface';

@Injectable()
export class MqttService implements OnModuleInit {
  private client: mqtt.MqttClient;

  constructor(private readonly influxService: InfluxService) {}

  onModuleInit() {
    this.client = mqtt.connect('mqtt://localhost:1883');
    console.log('CALLING MQTT SERVICE ON MODULE INIT');
    this.client.on('connect', () => {
      console.log('MQTT CONNECTED');

      this.client.subscribe('sensor/data', (err) => {
        if (!err) {
          console.log('subscribed to sensor/data');
        }
      });
    });

    this.client.on(
      'message',
      (topic: string, message: Buffer<ArrayBufferLike>) => {
        console.log(`message on topic ${topic}: ${message.toString()}`);

        try {
          const messageObject = JSON.parse(message.toString()) as SensorData;
          validateMessage(messageObject);

          this.influxService
            .writeSensorData(messageObject)
            .then(() => this.publish('api/topic', messageObject))
            .catch((e) => console.error('error while saving sensor data: ', e));
        } catch (error) {
          console.error('Invalid MQTT message received:', error);
        }
      },
    );
  }

  publish(topic: string, payload: any) {
    this.client.publish(topic, JSON.stringify(payload));
  }
}

function validateMessage(message: object) {
  const expectedKeys = ['sensor_id', 'temperature', 'humidity', 'timestamp'];
  const actualKeys = Object.keys(message);

  if (actualKeys.length !== 4) {
    throw new Error('actual keys length should be 4');
  }
  const extraKeys = actualKeys.filter((key) => !expectedKeys.includes(key));
  if (extraKeys.length > 0) {
    throw new Error(`Unexpected keys in payload: ${extraKeys.join(', ')}`);
  }

  const sensorData = message as SensorData;
  if (typeof sensorData.sensor_id !== 'string') {
    throw new Error('Invalid or missing sensor_id');
  }
  if (typeof sensorData.temperature !== 'number') {
    throw new Error('Invalid or missing temperature');
  }
  if (typeof sensorData.humidity !== 'number') {
    throw new Error('Invalid or missing humidity');
  }
  if (typeof sensorData.timestamp !== 'number') {
    throw new Error('Invalid or missing timestamp');
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (sensorData.timestamp > nowInSeconds) {
    throw new Error('Timestamp cannot be in the future');
  }
}
