import { Controller, Get, Query } from '@nestjs/common';
import { InfluxService } from './influx.service';

@Controller('influx')
export class InfluxController {
  constructor(private readonly influxService: InfluxService) {}

  @Get('data')
  async getSensorData(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('fields') fields: string,
    @Query('sort') sort: 'asc' | 'desc',
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    const fieldList = fields.split(',').map((f) => f.trim());
    return this.influxService.querySensorData({
      start,
      end,
      fields: fieldList,
      sort,
      limit: Number(limit),
      offset: Number(offset),
    });
  }
}
