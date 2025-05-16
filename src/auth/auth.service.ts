/* eslint-disable */
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/user.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  login(user: any) {
    const payload = { username: user.username, sub: user.id, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    if (createUserDto.role === UserRole.SYSTEM_ADMIN) {
      const systemAdminCount = await this.usersService.countByRole(
        UserRole.SYSTEM_ADMIN,
      );
      if (systemAdminCount > 0) {
        throw new ForbiddenException(
          'System admin can only be created by another system admin',
        );
      }
    }

    const user = await this.usersService.create(createUserDto);
    const { password: _, ...result } = user;

    return this.login(result);
  }
}
