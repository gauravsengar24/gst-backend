import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123', description: 'The current password of the user' })
  @IsString()
  oldPassword!: string;

  @ApiProperty({ example: 'newPassword123', description: 'The new password for the user' })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}
