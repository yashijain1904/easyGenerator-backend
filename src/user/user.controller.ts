import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Request,
  Response,
  UsePipes,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDto } from './dto/user.dto';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from 'src/auth/auth.guard';
import { JoiValidationPipe } from './validation.pipe';
import { signUpSchema } from './dto/signup.dto';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('signup')
  @UsePipes(new JoiValidationPipe(signUpSchema))
  async signUp(@Body() userDto: UserDto, @Response() res) {
    try {
      const newUser = await this.userService.addUser(userDto);
      const payload = { sub: newUser['_id'], name: newUser.name };
      const accessToken = await this.jwtService.signAsync(payload);
      return res.json({
        accessToken,
      });
    } catch (error) {
      res.status(404).send({
        error: error.message,
        code: error.code,
      });
    }
  }

  @Post('login')
  async logIn(@Body() signInDto: Record<string, any>, @Response() res) {
    try {
      const userData = await this.userService.signInUser(
        signInDto.email,
        signInDto.password,
      );
      const payload = { sub: userData['_id'], email: userData.email };
      const accessToken = await this.jwtService.signAsync(payload);
      return res.json({
        accessToken,
      });
    } catch (error) {
      res.status(404).send({
        error: error.message,
        code: error.code,
      });
    }
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
