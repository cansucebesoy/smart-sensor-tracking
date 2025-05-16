import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { InfluxModule } from 'src/influx/influx.module';

@Module({
  providers: [MqttService],
  imports: [InfluxModule],
  exports: [MqttService],
})
export class MqttModule {}
