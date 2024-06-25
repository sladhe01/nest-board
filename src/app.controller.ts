import { Controller, Get } from "@nestjs/common";
import { AppService } from "./app.service";
import { ApiTags, ApiOperation, ApiOkResponse } from "@nestjs/swagger";

@Controller()
@ApiTags("연결 확인")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ description: "연결을 확인합니다." })
  @ApiOkResponse({ description: "Hello World!" })
  getHello(): any {
    return this.appService.getHello();
  }
}
