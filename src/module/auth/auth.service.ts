import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) { }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.userModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Wrong email');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Wrong password');
    }

    const payload = { email: user.email, sub: user._id, role: user.role };
    return {
      message: 'Login successful',
      access_token: this.jwtService.sign(payload),
      user: {
        email: user.email,
        role: user.role,
        name: user.name,
      },
    };
  }

  async register(createUserDto: any) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });
    const savedUser = await createdUser.save();
    const userObj = savedUser.toObject() as any;
    delete userObj.password;
    return userObj;
  }

  create(createAuthDto: CreateAuthDto) {
    return this.register(createAuthDto);
  }

  findAll() {
    return this.userModel.find().sort({ createdAt: -1 }).select('-password').exec();
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

  async logout() {
    return {
      message: 'Logout successful',
      success: true
    };
  }
}
