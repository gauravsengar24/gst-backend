import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) { }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user._id, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.REFRESH_SECRET_KEY,
      expiresIn: '7d'
    });

    await this.userModel.findByIdAndUpdate(user._id, {
      refreshToken,
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      message: 'Login successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  }

  async register(createUserDto: any) {
    const createdUser = new this.userModel(createUserDto);
    const savedUser = await createdUser.save();
  }

  create(createAuthDto: CreateAuthDto) {
    return this.register(createAuthDto);
  }

  findAll() {
    return this.userModel.find().select('-password').exec();
  }

  findOne(id: string) {
    return this.userModel.findById(id).select('-password').exec();
  }

  update(id: string, updateAuthDto: UpdateAuthDto) {
    return this.userModel.findByIdAndUpdate(id, updateAuthDto, { new: true }).select('-password').exec();
  }

  remove(id: string) {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_SECRET_KEY,
      });
      const user = await this.userModel.findById(payload.sub);

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      const newPayload = { email: payload.email, sub: payload.sub, role: payload.role };
      const newAccessToken = this.jwtService.sign(newPayload);

      return {
        message: 'Token refreshed successfully',
        access_token: newAccessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async revokeRefreshToken(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1, refreshTokenExpiresAt: 1 }
    });
  }

  async logout(token: string) {
    try {
      const payload = this.jwtService.decode(token) as any;
      if (payload && payload.sub) {
        await this.revokeRefreshToken(payload.sub);
      }
    } catch (error) {
      console.log('Error during logout:', error);
    }

    return {
      message: 'Logout successful',
      success: true
    };
  }
}
