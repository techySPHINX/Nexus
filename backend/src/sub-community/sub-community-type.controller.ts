import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { SubCommunityTypeService } from './sub-community-type.service';
import { CreateSubCommunityTypeDto } from './dto/create-sub-community-type.dto';
import { UpdateSubCommunityTypeDto } from './dto/update-sub-community-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('sub-community-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubCommunityTypeController {
  constructor(private readonly svc: SubCommunityTypeService) {}

  @Get()
  async list() {
    console.log("getting subcommunity types");
    return this.svc.listTypes();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.svc.getTypeById(id);
  }

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateSubCommunityTypeDto) {
    return this.svc.createType(dto as any);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateSubCommunityTypeDto) {
    return this.svc.updateType(id, dto as any);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.svc.deleteType(id);
  }
}
