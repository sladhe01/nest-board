import { Controller, Post, Get, Body, Req, Res, UseGuards } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { SignInUserDto } from "./dto/signIn-user.dto";
import { UsersService } from "./users.service";
import { RefreshGuard } from "src/shared/guards/auth.guard";
import { Response, Request } from "express";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";

@Controller("users")
@ApiTags("회원가입 및 로그인")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ description: "회원가입을 합니다." })
  @ApiBody({
    schema: {
      type: "object",
      properties: { email: { type: "string" }, password: { type: "string" }, type: { enum: ["admin", "member"] } },
    },
  })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const { email, password, type } = createUserDto;
    await this.usersService.createUser(email, password, type);
    return "Create user successfully";
  }

  @ApiOperation({ description: "로그인을 합니다." })
  @ApiBody({
    schema: {
      type: "object",
      properties: { email: { type: "string" }, password: { type: "string" } },
    },
  })
  @Post("/sign_in")
  async signIn(@Body() signInUserDto: SignInUserDto, @Res({ passthrough: true }) res: Response): Promise<void> {
    const { email, password } = signInUserDto;
    const tokens = await this.usersService.signIn(email, password);
    return this.usersService.setTokenToCookie(res, tokens);
  }

  @ApiOperation({ description: "토큰을 재발급 받습니다." })
  @UseGuards(RefreshGuard)
  @Get("/refresh_access_token")
  async refreshAccessToken(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<void> {
    const refreshToken = req.cookies["refresh_token"];
    const refreshedAccessToken = this.usersService.refreshAccessToken(refreshToken);
    return this.usersService.setTokenToCookie(res, {
      accessToken: refreshedAccessToken,
      refreshToken: refreshToken,
    });
  }

  @ApiOperation({ description: "로그아웃을 합니다." })
  @Post("/sign_out")
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.usersService.signOut(req, res);
    return "sign out successfully";
  }
}
