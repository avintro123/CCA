import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async validateOAuthLogin(details: any) {
    let user = await this.userModel.findOne({ googleId: details.googleId });

    if (!user) {
      user = await this.userModel.create(details);
    }
    return user;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user._id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: user,
    };
  }
}
