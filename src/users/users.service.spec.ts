import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { authConfig } from 'src/config/authConfig';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserType } from 'src/shared/types/user-type.enum';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<UserEntity>;
  const mockConfig = {
    jwtAccessSecret: 'test-access-secret',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtAccessExpirationTime: '1h',
    jwtRefreshExpirationTime: '7d',
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            findOneByOrFail: jest.fn(),
          },
        },
        {
          provide: authConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      jest.spyOn(service as any, 'checkUserExist').mockResolvedValueOnce(null);
      jest
        .spyOn(service as any, 'hashPassword')
        .mockResolvedValueOnce('hashedPassword');
      jest.spyOn(userRepository, 'save').mockResolvedValueOnce(null);

      await service.createUser('test@test.com', 'password', UserType.Admin);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@test.com',
          hashedPassword: 'hashedPassword',
          type: UserType.Admin,
        }),
      );
    });

    it('should throw error for duplicated email', async () => {
      jest.spyOn(service as any, 'checkUserExist').mockResolvedValueOnce({});

      await expect(
        service.createUser('test@test.com', 'password', UserType.Admin),
      ).rejects.toThrow('duplicated account');
    });
  });

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      jest.spyOn(service as any, 'checkUserExist').mockResolvedValueOnce({});
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);
      jest.spyOn(service, 'issueAccessToken').mockReturnValue('accessToken');
      jest.spyOn(service, 'issueRefreshToken').mockReturnValue('refreshToken');
      jest.spyOn(service, 'setRefreshToken').mockResolvedValueOnce(null);

      const result = await service.signIn('test@test.com', 'password');

      expect(result).toEqual({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
    });

    it('should throw an error for non-existent user', async () => {
      jest.spyOn(service as any, 'checkUserExist').mockResolvedValueOnce(null);

      await expect(service.signIn('test@test.com', 'password')).rejects.toThrow(
        'Invalid sign in information',
      );
    });

    it('should throw an error if password is incorrect', async () => {
      jest.spyOn(service as any, 'checkUserExist').mockResolvedValueOnce({});
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);

      await expect(service.signIn('test@test.com', 'password')).rejects.toThrow(
        'Invalid sign in information',
      );
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify access token successfully', () => {
      const payload = {
        id: '0000-0000-0000-0000',
        email: 'test@test.com',
        type: UserType.Admin,
      };
      (jwt.verify as jest.Mock).mockReturnValueOnce(payload);

      const result = service.verifyAccessToken('accessToken');

      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith(
        'accessToken',
        mockConfig.jwtAccessSecret,
      );
    });

    it('should return false for invalid access token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new UnauthorizedException('Invalid token');
      });

      const result = service.verifyAccessToken('invalidAccessToken');

      expect(result).toEqual(false);
      expect(jwt.verify).toHaveBeenCalledWith(
        'invalidAccessToken',
        mockConfig.jwtAccessSecret,
      );
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token successfully', async () => {
      const payload = { id: '0000-0000-0000', email: 'test@test.com' };
      (jwt.verify as jest.Mock).mockReturnValueOnce(payload);
      (userRepository.findOneByOrFail as jest.Mock).mockResolvedValueOnce({
        id: payload.id,
        email: payload.email,
        hashedRefreshToken: 'hashedRefreshToken',
      });
      jest.spyOn(userRepository, 'findOneByOrFail');
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(true);

      const result = await service.verifyRefreshToken('refreshToken');

      expect(result).toEqual(payload);
      expect(jwt.verify).toHaveBeenCalledWith(
        'refreshToken',
        mockConfig.jwtRefreshSecret,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'refreshToken',
        'hashedRefreshToken',
      );
    });

    it('sholud return false for invalid refresh token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('');
      });

      const result = await service.verifyRefreshToken('invalidRefreshToken');

      expect(result).toEqual(false);
    });
  });

  describe('singOut', () => {
    it('should sign out successfully', async () => {
      const mockRequest = {
        cookies: { refresh_token: 'refreshToken', access_token: 'accessToken' },
      } as Request | any;
      const mockResponse = { clearCookie: jest.fn() } as unknown as Response;
      const mockPayload = { id: '0000-0000-0000-0000', email: 'test@test.com' };

      (jwt.decode as jest.Mock).mockReturnValueOnce({ id: mockPayload.id });
      jest.spyOn(jwt, 'decode');
      jest.spyOn(service, 'removeRefreshToken').mockResolvedValueOnce(null);

      await service.signOut(mockRequest, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(service.removeRefreshToken).toHaveBeenCalledWith(mockPayload.id);
    });

    it('should throw error for already signed out', async () => {
      const mockRequest = { cookies: {} } as Request | any;
      const mockResponse = {} as unknown as Response;

      await expect(service.signOut(mockRequest, mockResponse)).rejects.toThrow(
        'Aleady signed out',
      );
    });
  });
});
