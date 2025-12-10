import { PartialType } from '@nestjs/mapped-types'; // Cambiar de @nestjs/swagger
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ required: false })
  isActive?: boolean;
}