import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';

import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) { }

  async login(loginDto: LoginDto) {
    try {
      if (loginDto.email === 'admin@example.com' && loginDto.password === 'password123') {
        const payload = { email: loginDto.email, sub: 'admin-id' };
        return {
          message: 'Login successful',
          access_token: this.jwtService.sign(payload),
          user: {
            email: loginDto.email,
            role: 'admin',
          },
        };
      }
      return {
        message: 'Invalid credentials',
      };
    } catch (error) {
      return {
        message: "Error"
      }
    }
  }


  create(createAuthDto: CreateAuthDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
