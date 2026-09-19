import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Nest-level gate here is defense-in-depth on top of the remote_users_insert RLS
  // policy — both independently enforce "administrator, own institution only".
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.administrator)
  @ApiOperation({
    summary: 'Provision a new user',
    description:
      "Admin-only. Creates the account in Supabase Auth (GoTrue) and its ECOS profile in one call. The new user always lands in the calling administrator's own institution — there is no public self-signup.",
  })
  @ApiResponse({
    status: 201,
    description: 'User created.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is not an administrator.',
  })
  @ApiResponse({
    status: 409,
    description: 'The email address is already in use.',
  })
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser?: RequestUser,
  ) {
    return this.usersService.create(
      createUserDto,
      currentUser?.institutionId ?? null,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List users',
    description:
      'Returns the users visible to the caller. RLS scopes the result set — it is not necessarily every user in the system.',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number, example: 0 })
  @ApiQuery({ name: 'take', required: false, type: Number, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of users.',
    type: [UserResponseDto],
  })
  findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ) {
    return this.usersService.findAll(skip, take);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({
    status: 200,
    description: 'User found.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The user does not exist, or is not visible to the caller.',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({
    status: 200,
    description: 'User updated.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'The user does not exist, or is not visible to the caller.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.administrator)
  @ApiOperation({ summary: 'Delete a user', description: 'Admin-only.' })
  @ApiResponse({
    status: 200,
    description: 'User deleted.',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'The caller is not an administrator.',
  })
  @ApiResponse({
    status: 404,
    description: 'The user does not exist, or is not visible to the caller.',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
