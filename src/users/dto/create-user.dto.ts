import {
  IsString,
  MinLength,
  MaxLength,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { UserType } from 'src/shared/types/user-type.enum';

export class CreateUserDto {
  @IsString()
  @IsEmail()
  @MinLength(6)
  @MaxLength(60)
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  password: string;

  @IsEnum(UserType)
  type: UserType;
}
