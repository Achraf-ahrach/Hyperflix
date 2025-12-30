import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) { }

  // Mock user validation (Replace with DB check)
  async validateUser(username: string, pass: string): Promise<any> {
    if (username === 'yel' && pass === '123') {
      const { ...result } = { id: 1, username: 'yel' };
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}