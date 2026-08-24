import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  /**
   * username login
   */
  @IsString()
  @IsNotEmpty({ message: 'Username wajib diisi' })
  username!: string;

  /**
   * password login 
   */
  @IsString()
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password!: string;
}
