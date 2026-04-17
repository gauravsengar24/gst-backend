import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from '../schemas/user.schema';

export class CreateAuthDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  name!: string;

  @ApiProperty({ example: "example@gmail.com", description: 'Email address of the user' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password for the user' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'admin', enum: Role, description: 'Role of the user' })
  @IsEnum(Role)
  role!: Role;
}
