import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common'
import { ModulosService } from './modulos.service'
import { CreateModuloDto } from './dto/create-modulo.dto'
import { UpdateModuloDto } from './dto/update-modulo.dto'

@Controller()
export class ModulosController {
  constructor(private readonly service: ModulosService) {}

  @Get('plans/:planId/modulos')
  findByPlan(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.service.findByPlan(planId)
  }

  @Post('plans/:planId/modulos')
  create(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreateModuloDto,
  ) {
    return this.service.create(planId, dto)
  }

  @Patch('modulos/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateModuloDto) {
    return this.service.update(id, dto)
  }

  @Delete('modulos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id)
  }
}
