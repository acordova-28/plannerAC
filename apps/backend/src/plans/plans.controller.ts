import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsUUID, IsInt, Min, Max } from 'class-validator';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

class AddMemberDto {
  @IsUUID('4')
  userId: string;
}

class UpdateMemberHoursDto {
  @IsInt()
  @Min(1)
  @Max(24)
  horasPorDia: number;
}

@Controller('plans')
export class PlansController {
  constructor(private readonly service: PlansService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/members')
  getMembers(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getMembers(id);
  }

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePlanDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/members')
  addMember(
    @Param('id', ParseUUIDPipe) planId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.service.addMember(planId, dto.userId);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('id', ParseUUIDPipe) planId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.service.removeMember(planId, userId);
  }

  @Patch(':id/members/:userId')
  updateMemberHours(
    @Param('id', ParseUUIDPipe) planId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateMemberHoursDto,
  ) {
    return this.service.updateMemberHours(planId, userId, dto.horasPorDia);
  }

  @Post(':id/freeze-baseline')
  @HttpCode(HttpStatus.NO_CONTENT)
  freezeBaseline(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.freezeBaseline(id);
  }

  @Post(':id/recalculate')
  @HttpCode(HttpStatus.NO_CONTENT)
  recalculate(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.recalculate(id);
  }
}
