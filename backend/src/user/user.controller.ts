import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

/**
 * Controller for handling user-related requests.
 * Protected by JWT authentication and role-based access control.
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Retrieves all users. Requires ADMIN role.
   * @returns A promise that resolves to an array of all users.
   */
  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  /**
   * Retrieves a specific user by their ID.
   * @param id - The ID of the user to retrieve.
   * @returns A promise that resolves to the user object.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  /**
   * Updates a specific user's information.
   * @param id - The ID of the user to update.
   * @param dto - The data to update the user with.
   * @returns A promise that resolves to the updated user object.
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  /**
   * Deletes a specific user.
   * @param id - The ID of the user to delete.
   * @returns A promise that resolves when the user has been deleted.
   */
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
