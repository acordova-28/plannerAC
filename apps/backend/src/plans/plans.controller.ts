import {
  Controller, Get, Post, Patch, Delete, Body, Param, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common'
import { PlansService } from './plans.service'
import { CreatePlanDto } from './dto/create-plan.dto'
import { UpdatePlanDto } from './dto/update-plan.dto'

@Controller('plans')
export class PlansController {
  constructor(private readonly service: PlansService) {}

  @Get()
  findAll() {
    return this.service.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id)
  }

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.service.create(dto)
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlanDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id)
  }

  @Post(':id/freeze-baseline')
  @HttpCode(HttpStatus.NO_CONTENT)
  freezeBaseline(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.freezeBaseline(id)
  }

  @Post(':id/recalculate')
  @HttpCode(HttpStatus.NO_CONTENT)
  recalculate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.recalculate(id)
  }
}
