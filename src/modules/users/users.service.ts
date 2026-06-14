
import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({ email: createUserDto.email }).exec();
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await argon2.hash(createUserDto.password);
    const user = new this.userModel({
      email: createUserDto.email,
      password: hashedPassword,
      roles: createUserDto.roles ?? ['USER'],
      permissions: createUserDto.permissions ?? [],
      isActive: true,
    });

    return user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password +currentHashedRefreshToken').exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('+currentHashedRefreshToken').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const changes: Partial<User> = {};
    if (updateUserDto.password) {
      changes.password = await argon2.hash(updateUserDto.password);
    }
    if (updateUserDto.roles) {
      changes.roles = updateUserDto.roles;
    }
    if (updateUserDto.permissions) {
      changes.permissions = updateUserDto.permissions;
    }
    if (typeof updateUserDto.isActive === 'boolean') {
      changes.isActive = updateUserDto.isActive;
    }

    const user = await this.userModel.findByIdAndUpdate(id, changes, { new: true }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async setCurrentRefreshToken(hashedRefreshToken: string, userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { currentHashedRefreshToken: hashedRefreshToken }).exec();
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { $unset: { currentHashedRefreshToken: '' } }).exec();
  }
}
