import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { Observable } from 'rxjs';
import { Response } from 'express';
@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();
    const jwtRefreshToken = request.cookies['refresh_token'];
    if (!jwtRefreshToken) {
      throw new UnauthorizedException('no refresh_token');
    }
    const validRefreshToken =
      await this.usersService.verifyRefreshToken(jwtRefreshToken);
    if (!validRefreshToken) {
      this.usersService.signOut(request, response);
      throw new UnauthorizedException('unvalid refresh_token');
    }
    return true;
  }
}

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(private usersService: UsersService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();
    const jwtAccessToken = request.cookies['access_token'];
    if (!jwtAccessToken) {
      throw new UnauthorizedException('no access_token');
    }
    const validAccessToken =
      this.usersService.verifyAccessToken(jwtAccessToken);
    if (!validAccessToken) {
      response.redirect('/users/refresh_access_token');
    }
    request.user = validAccessToken;
    return true;
  }
}
