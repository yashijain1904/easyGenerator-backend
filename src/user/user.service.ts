import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { UserDto } from './dto/user.dto';
import { hash, genSalt, compare } from 'bcrypt';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async addUser(userDto: UserDto) {
    try {
      const salt = await genSalt(10);
      const hashPassword = await hash(userDto.password, salt);
      const newUser = await new this.userModel({
        email: userDto.email,
        name: userDto.name,
        password: hashPassword,
      }).save();
      return newUser;
    } catch (err) {
      if (err.code === 11000) {
        const error = new Error('email already exist');
        error['code'] = 'ERR_102';
        throw error;
      }
      err.code = 'ERR_999';
      throw err;
    }
  }

  async findUser(userEmail: string) {
    const userData = await this.userModel.findOne({ email: userEmail });
    return userData;
  }

  async signInUser(userEmail: string, pass: string): Promise<any> {
    try {
      const userData: any = await this.findUser(userEmail);
      if (userData == null) {
        const error = new Error('user is not present');
        error['code'] = 'ERR_103';
        throw error;
      }
      const validPassword = await compare(pass, userData?.password);
      if (!validPassword) {
        const error = new Error('Invalid Password');
        error['code'] = 'ERR_103';
        throw error;
      }
      return userData;
    } catch (error) {
      throw error;
    }
  }
}
