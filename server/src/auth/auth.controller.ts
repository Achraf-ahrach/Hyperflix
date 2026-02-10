import {
  Controller,
  Post,
  UseGuards,
  Res,
  Request,
  Get,
  Body,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ============== Registration ==============
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      properties: {
        message: { type: 'string', example: 'Registration successful' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'johndoe' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            avatarUrl: { type: 'string', nullable: true, example: null },
            provider: { type: 'string', example: 'local' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'User already exists or invalid data',
  })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const user = await this.authService.register(registerDto);

      return {
        message:
          'Registration successful. Please check your email to verify your account.',
        user,
      };
    } catch (error) {
      throw new BadRequestException({
        statusCode: 400,
        message: error.message,
        error: 'Bad Request',
      });
    }
  }

  // ============== Email Verification ==============
  @ApiOperation({
    summary: 'Verify email address',
    description:
      'Verifies user email address using the token sent via email. The token is valid for 24 hours.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Email verified successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid verification token' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    try {
      return await this.authService.verifyEmail(token);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @ApiOperation({
    summary: 'Resend verification email',
    description:
      'Sends a new verification email to the user if the previous token expired or was not received.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
          description:
            'Email address of the user who needs a new verification link',
        },
      },
      required: ['email'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Verification email sent successfully',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Verification email sent successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'User not found or email already verified',
    schema: {
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Email already verified',
          description:
            'Could be: "User not found", "Email already verified", or "Failed to send verification email"',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @Post('resend-verification')
  async resendVerification(@Body('email') email: string) {
    try {
      return await this.authService.resendVerificationEmail(email);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // ============== Local Authentication ==============
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Successful login',
    schema: {
      properties: {
        message: { type: 'string', example: 'Success' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'username' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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
    // console.log('\n42 OAuth callback user:', req.user);
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

  // ============== GitHub OAuth ==============
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubAuth() {
    // Initiates GitHub OAuth flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthCallback(
    @Request() req,
    @Res({ passthrough: true }) response: Response,
  ) {
    console.log('\nGitHub OAuth callback user:', req.user);
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

  // Add these methods before the closing brace of the controller

  @ApiOperation({
    summary: 'Request password reset',
    description:
      "Sends a password reset link to the user's email if the account exists.",
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Reset link sent (always returns success for security)',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'If that email exists, a password reset link has been sent',
        },
      },
    },
  })
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @ApiOperation({
    summary: 'Reset password with token',
    description:
      'Resets the user password using the token from the email link.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Password reset successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired token',
  })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      return await this.authService.resetPassword(
        resetPasswordDto.token,
        resetPasswordDto.newPassword,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
