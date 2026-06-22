import {
  Controller, Get, Post, Patch, Put, Delete,
  Body, Param, ParseUUIDPipe, HttpCode, HttpStatus,
  UseGuards, Res,
} from '@nestjs/common'
import { Response } from 'express'
import { TasksService } from './tasks.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { ReorderTasksDto } from './dto/reorder-tasks.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller()
export class TasksController {
  constructor(private readonly service: TasksService) {}

  // ── Endpoints planos (para Estimacion_WUOLLA.html) ─────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('tareas')
  findAll() {
    return this.service.findAll()
  }

  // Nota: esta ruta debe estar antes de GET tareas/:id para evitar
  // que "exportar" sea interpretado como un UUID.
  @UseGuards(JwtAuthGuard)
  @Get('tareas/exportar/csv')
  async exportCsv(@Res() res: Response) {
    const csv = await this.service.exportCsv()
    const filename = `Estimacion_WUOLLA_${new Date().toISOString().slice(0, 10)}.csv`
    res
      .set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      })
      .send(csv)
  }

  // ── Endpoints anidados existentes ──────────────────────────────────────────

  @Get('modulos/:moduloId/tareas')
  findByModulo(@Param('moduloId', ParseUUIDPipe) moduloId: string) {
    return this.service.findByModulo(moduloId)
  }

  @Get('tareas/:id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id)
  }

  @Post('modulos/:moduloId/tareas')
  create(
    @Param('moduloId', ParseUUIDPipe) moduloId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.service.create(moduloId, dto)
  }

  @Patch('tareas/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.service.update(id, dto)
  }

  // PUT como alias de PATCH (para compatibilidad con Estimacion_WUOLLA.html)
  @UseGuards(JwtAuthGuard)
  @Put('tareas/:id')
  updatePut(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.service.update(id, dto)
  }

  @Delete('tareas/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id)
  }

  @Post('plans/:planId/reorder-tasks')
  @HttpCode(HttpStatus.NO_CONTENT)
  reorder(
    @Param('planId', ParseUUIDPipe) _planId: string,
    @Body() dto: ReorderTasksDto,
  ) {
    return this.service.reorder(dto)
  }
}
