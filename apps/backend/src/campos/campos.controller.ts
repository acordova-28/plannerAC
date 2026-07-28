import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CamposService } from './campos.service';
import { CreateCampoDto } from './dto/create-campo.dto';
import { SetValorDto } from './dto/set-valor.dto';

@Controller()
export class CamposController {
  constructor(private readonly service: CamposService) {}

  @Get('plans/:planId/campos')
  findByPlan(@Param('planId', ParseUUIDPipe) planId: string) {
    return this.service.findByPlan(planId);
  }

  @Post('plans/:planId/campos')
  create(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreateCampoDto,
  ) {
    return this.service.create(planId, dto);
  }

  @Patch('campos/:id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateCampoDto) {
    return this.service.update(id, dto);
  }

  @Delete('campos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Put('tasks/:taskId/campos/:campoId')
  setValor(
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Param('campoId', ParseUUIDPipe) campoId: string,
    @Body() dto: SetValorDto,
  ) {
    return this.service.setValor(taskId, campoId, dto);
  }

  @Get('tasks/:taskId/dinamicos')
  getValoresByTask(@Param('taskId', ParseUUIDPipe) taskId: string) {
    return this.service.getValoresByTask(taskId);
  }
}
