import { registerAs } from '@nestjs/config';

export const authConfig = registerAs('auth', () => ({
  jwtAccessSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
  jwtAccessExpirationTime: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
  jwtRefreshSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
  jwtRefreshExpirationTime: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
}));
