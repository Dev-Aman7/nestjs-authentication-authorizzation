
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { JwtPayload } from '../../shared/interfaces/jwt-payload.interface';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { StringValue } from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserDocument | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await argon2.verify(user.password, password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userId = user._id.toString();
    const accessToken = await this.createAccessToken(userId, user);
    const refreshToken = await this.createRefreshToken(userId);
    const hashedRefreshToken = await argon2.hash(refreshToken);
    await this.usersService.setCurrentRefreshToken(hashedRefreshToken, userId);

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
      },
    };
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.currentHashedRefreshToken) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const tokenMatches = await argon2.verify(user.currentHashedRefreshToken, refreshToken);
    if (!tokenMatches) {
      throw new UnauthorizedException('Refresh token is invalid');
    }

    const userId = user._id.toString();
    const accessToken = await this.createAccessToken(userId, user);
    const newRefreshToken = await this.createRefreshToken(userId);
    const hashedRefreshToken = await argon2.hash(newRefreshToken);
    await this.usersService.setCurrentRefreshToken(hashedRefreshToken, userId);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(userId: string) {
    await this.usersService.removeRefreshToken(userId);
  }

  async createAccessToken(userId: string, user: UserDocument): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
      roles: user.roles,
      permissions: user.permissions,
    };

    const issuer: string = this.getRequiredConfig('jwt.issuer');
    const audience: string = this.getRequiredConfig('jwt.audience');
    const expiresIn = this.getRequiredConfig('jwt.accessTokenExpiration') as StringValue;
    const signOptions: JwtSignOptions = {
      algorithm: 'RS256',
      subject: userId,
      issuer,
      audience,
      expiresIn,
    };

    return this.jwtService.signAsync(payload, signOptions);
  }

  async createRefreshToken(userId: string): Promise<string> {
    const issuer: string = this.getRequiredConfig('jwt.issuer');
    const audience: string = this.getRequiredConfig('jwt.audience');
    const expiresIn = this.getRequiredConfig('jwt.refreshTokenExpiration') as StringValue;
    const signOptions: JwtSignOptions = {
      algorithm: 'RS256',
      subject: userId,
      issuer,
      audience,
      expiresIn,
    };

    return this.jwtService.signAsync({ sub: userId }, signOptions);
  }

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (!value) {
      throw new Error(`Missing configuration value for ${key}`);
    }
    return value;
  }

  async verifyRefreshToken(refreshToken: string) {
    const publicKeyPath = this.getRequiredConfig('jwt.publicKeyPath');
    const publicKey = readFileSync(resolve(process.cwd(), publicKeyPath), 'utf8');
    const issuer = this.getRequiredConfig('jwt.issuer');
    const audience = this.getRequiredConfig('jwt.audience');

    return this.jwtService.verifyAsync(refreshToken, {
      secret: publicKey,
      issuer,
      audience,
      algorithms: ['RS256'],
    });
  }
}
