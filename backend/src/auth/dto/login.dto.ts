import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;

  @IsNotEmpty({ message: 'mật khẩu không được để trống' })
  @IsString()
  @MinLength(6, { message: 'mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(20, { message: 'mật khẩu không được vượt quá 20 ký tự' })
  password!: string;
}
