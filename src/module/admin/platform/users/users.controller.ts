import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { LogActivity } from '../../../../common/decorators/log-activity.decorator';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { UsersService } from '../../../../shared/users/users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { ListAdminsQueryDto } from './dto/list-admins.query.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@ApiTags('cms-platform-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('superadmin')
@Controller('cms/platform/users')
export class PlatformUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: ListAdminsQueryDto) {
    return this.usersService.findAllAdmins(query.tenantId);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.usersService.getAdminOrThrow(id);
  }

  @Post()
  @LogActivity('user.create', 'user')
  create(@Body() dto: CreateAdminDto) {
    return this.usersService.createAdmin(dto.tenantId, dto.email, dto.password);
  }

  @Patch(':id')
  @LogActivity('user.update', 'user')
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.usersService.updateAdminEmail(id, dto.email);
  }

  @Post(':id/disable')
  @LogActivity('user.disable', 'user')
  disable(@Param('id') id: string) {
    return this.usersService.disable(id);
  }
}
