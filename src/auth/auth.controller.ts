/* eslint-disable */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { Public } from './decorators/public.decorator';
import { ApiTags, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { LoginUserDto } from 'src/users/dtos/login-user.dto.';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginUserDto: LoginUserDto) {
    const user = await this.authService.validateUser(
      loginUserDto.username,
      loginUserDto.password,
    );
    return this.authService.login(user);
  }

  @Public()
  @Post('register')
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Username already exists' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Get('profile')
  @ApiBearerAuth()
  getProfile(@Request() req) {
    return req.user;
  }

  @Roles(UserRole.SYSTEM_ADMIN)
  @Get('system-admin')
  @ApiBearerAuth()
  getSystemAdminData() {
    return { message: 'This is system admin only data' };
  }

  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  @Get('admin')
  @ApiBearerAuth()
  getAdminData() {
    return { message: 'This is for system and company admins' };
  }

  @Roles(UserRole.COMPANY_ADMIN)
  @Get('company-admin')
  @ApiBearerAuth()
  getCompanyAdminData() {
    return { message: 'This is company admin only data' };
  }
}
