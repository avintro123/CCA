import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const dbUser = await this.authService.validateOAuthLogin(req.user);
    const jwtData = await this.authService.login(dbUser);

    // Redirecting back to frontend with the token and user data in the URL
    // We encode the user object as a URI string so it travels safely!
    const userData = encodeURIComponent(JSON.stringify(jwtData.user));
    return res.redirect(
      `http://localhost:5173/?token=${jwtData.access_token}&user=${userData}`,
    );
  }
}
