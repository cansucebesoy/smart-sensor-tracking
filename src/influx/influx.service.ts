import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  InfluxDB,
  Point,
  QueryApi,
  WriteApi,
} from '@influxdata/influxdb-client';
import { SensorData } from './interface/sensor-data.interface';
import { QueryOptions } from './interface/query-options.interface';

@Injectable()
export class InfluxService implements OnModuleDestroy {
  private client: InfluxDB;
  private org: string;
  private bucket: string;
  private readonly logger = new Logger(InfluxService.name);
  private writeApi: WriteApi;
  private queryApi: QueryApi;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>(
      'INFLUXDB_URL',
      'http://localhost:8086',
    );
    const token = this.configService.get<string>('INFLUXDB_TOKEN', 'mytoken');
    this.org = this.configService.get<string>('INFLUXDB_ORG', 'myorg');
    this.bucket = this.configService.get<string>('INFLUXDB_BUCKET', 'mybucket');

    this.client = new InfluxDB({ url, token });
    this.writeApi = this.client.getWriteApi(this.org, this.bucket);
    this.queryApi = this.client.getQueryApi(this.org);
  }

  async writeSensorData(sensorData: SensorData) {
    console.log('writing sensor data: ', sensorData);
    const point = new Point('sensor-data')
      .tag('sensor_id', sensorData.sensor_id)
      .floatField('temperature', sensorData.temperature)
      .floatField('humidity', sensorData.humidity)
      .timestamp(new Date(sensorData.timestamp * 1000));

    this.writeApi.writePoint(point);

    try {
      await this.writeApi.flush();
      this.logger.log(`Data written for sensor ${sensorData.sensor_id}`);
    } catch (error) {
      this.logger.error(
        `Error writing data for sensor ${sensorData.sensor_id}`,
        error,
      );
    }
  }

  async querySensorData(options: QueryOptions) {
    const { start, end, fields, sort, limit, offset } = options;
    const fieldFilter = fields.map((f) => `r._field == "${f}"`).join(' or ');
    const query = `
    from(bucket: "${this.bucket}")
      |> range(start: ${start}, stop: ${end})
      |> filter(fn: (r) => r._measurement == "sensor-data")
      |> filter(fn: (r) => ${fieldFilter})
      |> sort(columns: ["_time"], desc: ${sort === 'desc'})
      |> limit(n: ${limit}, offset: ${offset})
  `;

    try {
      const result = await this.queryApi.collectRows(query);
      return result;
    } catch (error) {
      this.logger.error(`Error querying data for sensor`, error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.writeApi.close();
    console.log(' Influx DB WRITEAPI CLOSED');
  }
}
