import {
  Injectable,
  Inject,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { UserType } from '../shared/types/user-type.enum';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import * as uuid from 'uuid';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { authConfig } from '../config/authConfig';
import { Response, Request } from 'express';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';

interface User {
  id: string;
  email: string;
  type?: UserType;
}

@Injectable()
export class UsersService {
  constructor(
    @Inject(authConfig.KEY) private config: ConfigType<typeof authConfig>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}
  async createUser(
    userEmail: string,
    userPassword: string,
    userType: UserType,
  ) {
    const existingUser = await this.checkUserExist(userEmail);
    if (existingUser) {
      throw new HttpException('duplicated account', HttpStatus.CONFLICT);
    }
    const user = new UserEntity();
    const hashedPassword = await this.hashPassword(userPassword);
    user.id = uuid.v1();
    user.email = userEmail;
    user.hashedPassword = hashedPassword;
    user.type = userType;
    await this.userRepository.save(user);
    return;
  }

  private async checkUserExist(mail: string) {
    const user = await this.userRepository.findOne({ where: { email: mail } });
    return user;
  }

  private async hashPassword(password: string) {
    const saltRound = Number(process.env.BCRYPT_SALT_ROUND);
    return await bcrypt.hash(password, saltRound);
  }

  async signIn(email: string, password: string): Promise<any> {
    const existingUser = await this.checkUserExist(email);
    if (!existingUser) {
      throw new NotFoundException('Invalid sign in information');
    }
    const isCorrectPassword = await bcrypt.compare(
      password,
      existingUser.hashedPassword,
    );
    if (!isCorrectPassword) {
      throw new UnauthorizedException('Invalid sign in information');
    }
    const accessToken = this.issueAccessToken({
      id: existingUser.id,
      email: existingUser.email,
      type: existingUser.type,
    });
    const refreshToken = this.issueRefreshToken({
      id: existingUser.id,
      email: existingUser.email,
    });
    await this.setRefreshToken(existingUser.id, refreshToken);
    return { accessToken, refreshToken };
  }

  async setRefreshToken(userId: string, refreshToken: string) {
    const saltRound = Number(process.env.BCRYPT_SALT_ROUND);
    const hashedRefreshToken = await bcrypt.hash(refreshToken, saltRound);
    return await this.userRepository.update(userId, { hashedRefreshToken });
  }

  issueAccessToken(user: User): string {
    const payload = { ...user };
    return jwt.sign(payload, this.config.jwtAccessSecret, {
      expiresIn: this.config.jwtAccessExpirationTime,
    });
  }

  issueRefreshToken(user: User): string {
    const { type, ...payload } = user;
    return jwt.sign(payload, this.config.jwtRefreshSecret, {
      expiresIn: this.config.jwtRefreshExpirationTime,
    });
  }

  verifyAccessToken(jwtAccessToken: string) {
    try {
      const payload = jwt.verify(
        jwtAccessToken,
        this.config.jwtAccessSecret,
      ) as jwt.JwtPayload | User;
      const { id, email, type } = payload;
      return { id: id, email: email, type: type };
    } catch (error) {
      return false;
    }
  }

  async verifyRefreshToken(jwtRefreshToken: string) {
    try {
      const payload = jwt.verify(
        jwtRefreshToken,
        this.config.jwtRefreshSecret,
      ) as jwt.JwtPayload | User;
      const { id, email } = payload;
      const { hashedRefreshToken } = await this.userRepository.findOneByOrFail({
        id,
        email,
      });
      const isValidRefreshToken = await bcrypt.compare(
        jwtRefreshToken,
        hashedRefreshToken,
      );
      if (!isValidRefreshToken) {
        throw new UnauthorizedException('invalid refresh token');
      } else return { id, email };
    } catch (error) {
      return false;
    }
  }

  setTokenToCookie(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const { accessToken, refreshToken } = tokens;
    res.cookie('access_token', accessToken, { httpOnly: true });
    res.cookie('refresh_token', refreshToken, { httpOnly: true });
  }

  refreshAccessToken(refreshToken: string): string {
    const { id, email } = jwt.verify(
      refreshToken,
      this.config.jwtRefreshSecret,
    ) as jwt.JwtPayload | User;
    return this.issueAccessToken({ id, email });
  }
  async signOut(req: Request, res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new Error('Aleady signed out');
    }
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    const { id } = jwt.decode(refreshToken) as jwt.JwtPayload | User;
    await this.removeRefreshToken(id);
    return;
  }

  async removeRefreshToken(userId: string) {
    this.userRepository.update(userId, { hashedRefreshToken: null });
  }
}
