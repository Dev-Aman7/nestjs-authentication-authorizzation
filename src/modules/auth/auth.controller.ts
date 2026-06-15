
import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { REFRESH_TOKEN_COOKIE_NAME, REFRESH_TOKEN_PATH } from '../../shared/constants/auth.constants';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(201)
  @ApiOperation({ summary: 'Register a new user with default USER role' })
  @ApiResponse({ status: 201, description: 'User registered and access/refresh tokens issued.' })
  async signup(@Body() signupDto: SignupDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.signup({ email: signupDto.email, password: signupDto.password });

    const secure = process.env.NODE_ENV === 'production';
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: REFRESH_TOKEN_PATH,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: result.accessToken, user: { id: result.user._id.toString(), email: result.user.email, roles: result.user.roles, permissions: result.user.permissions } };
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login an existing user and issue access/refresh tokens' })
  @ApiResponse({ status: 200, description: 'User logged in and refresh token cookie is set.' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto);
    const secure = process.env.NODE_ENV === 'production';

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: REFRESH_TOKEN_PATH,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: result.accessToken };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiCookieAuth('refresh-token')
  @ApiOperation({ summary: 'Refresh access token using the refresh token cookie' })
  @ApiResponse({ status: 200, description: 'New access token is returned and refresh cookie updated.' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const result = await this.authService.refresh(refreshToken);
    const secure = process.env.NODE_ENV === 'production';

    res.cookie(REFRESH_TOKEN_COOKIE_NAME, result.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: REFRESH_TOKEN_PATH,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return { accessToken: result.accessToken };
  }

  @Post('logout')
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @UseGuards(PermissionsGuard)
  @ApiOperation({ summary: 'Logout the authenticated user and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Refresh token cookie cleared and refresh token invalidated.' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = req.user as { sub: string };
    if (!user?.sub) {
      throw new UnauthorizedException('User context missing');
    }

    await this.authService.logout(user.sub);
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: REFRESH_TOKEN_PATH,
    });

    return { success: true };
  }
}
