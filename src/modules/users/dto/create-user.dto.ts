
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ example: ['USER'], required: false })
  @IsArray()
  @IsOptional()
  roles?: string[] = ['USER'];

  @ApiProperty({ example: ['user.read'], required: false })
  @IsArray()
  @IsOptional()
  permissions?: string[] = [];
}
