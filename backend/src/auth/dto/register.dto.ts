import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username!: string;

  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @IsNotEmpty({ message: 'mật khẩu không được để trống' })
  @IsString()
  @MinLength(6, { message: 'mật khẩu phải có ít nhất 6 ký tự' })
  @MaxLength(20, { message: 'mật khẩu không được vượt quá 20 ký tự' })
  password!: string;
}
