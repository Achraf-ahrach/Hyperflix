import {
  Controller,
  Post,
  UseGuards,
  Res,
  Request,
  Get,
  Body,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ============== Registration ==============
  @Post('register')
  async register(
    @Body() registerDto: { email: string; username: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const user = await this.authService.register(registerDto);
      const { access_token } = await this.authService.login(user);

      response.cookie('Authentication', access_token, {
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax',
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      return { message: 'Registration successful', user };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // ============== Local Authentication ==============
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req, @Res({ passthrough: true }) response: Response) {
    const { access_token } = await this.authService.login(req.user);

    response.cookie('Authentication', access_token, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return { message: 'Success', user: req.user };
  }

  // ============== Google OAuth ==============
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token } = await this.authService.login(req.user);

    response.cookie('Authentication', access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Redirect to frontend after successful login
    return response.redirect('http://localhost:3000/');
  }

  // ============== 42 OAuth ==============
  @Get('42')
  @UseGuards(AuthGuard('42'))
  async fortyTwoAuth() {
    // Initiates 42 OAuth flow
  }

  @Get('42/callback')
  @UseGuards(AuthGuard('42'))
  async fortyTwoAuthCallback(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token } = await this.authService.login(req.user);

    response.cookie('Authentication', access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Redirect to frontend after successful login
    return response.redirect('http://localhost:3000/');
  }

  // ============== Protected Routes ==============
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('Authentication');
    return { message: 'Logged out' };
  }
}
