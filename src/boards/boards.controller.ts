import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from "@nestjs/common";
import { BoardsService } from "./boards.service";
import { CreateBoardDto } from "./dto/create-board.dto";
import { UpdateBoardDto } from "./dto/update-board.dto";
import { RefreshGuard, AccessGuard } from "src/shared/guards/auth.guard";
import { AdminGuard, BoardAbilityGuard } from "src/shared/guards/ability.guard";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";

@Controller("boards")
@ApiTags("게시판")
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}
  @UseGuards(RefreshGuard, AccessGuard, AdminGuard)
  @Post()
  @ApiOperation({ description: "게시판을 생성합니다." })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        category: { enum: ["notice", "inquiry", "qna"] },
      },
      required: ["title", "category"],
    },
  })
  async create(@Body() createBoardDto: CreateBoardDto, @Req() req) {
    const authorEmail = req.user.email;
    await this.boardsService.createBoard(createBoardDto, authorEmail, req.files);
    return "create board successfully";
  }

  @ApiOperation({ description: "게시물 목록을 조회합니다." })
  @Get()
  getList(
    @Query("page") page: number,
    @Query("limit") limit,
    @Query("orderBy") orderBy: "views" | "createdAt",
    @Query("order") order: "DESC" | "ASC",
    @Query("period") period: "year" | "month" | "week" | "whole",
    @Query("criteria") criteria?: "all" | "title" | "author",
    @Query("search") keyword?: string
  ) {
    if (!page) page = 1;
    if (!limit) limit = 10;
    if (!orderBy || orderBy !== ("views" || "createdAt")) orderBy = "createdAt";
    if (!order || order !== ("DESC" || "ASC")) order = "DESC";
    if (!period || period !== ("year" || "month" || "week" || "whole")) period = "whole";
    if (criteria && criteria !== ("all" || "title" || "author")) criteria = "all";
    return this.boardsService.getList(page, limit, orderBy, order, period, criteria, keyword);
  }

  @ApiOperation({ description: "하나의 게시물을 조회합니다." })
  @Get(":id")
  getOne(@Param("id") boardId: number) {
    return this.boardsService.getOne(boardId);
  }

  @UseGuards(RefreshGuard, AccessGuard, AdminGuard, BoardAbilityGuard)
  @ApiOperation({ description: "게시물을 수정합니다." })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        content: { type: "string" },
        category: { enum: ["notice", "inquiry", "qna"] },
      },
    },
  })
  @Patch(":id")
  updateBoard(@Param("id") boardId: number, @Body() updateBoardDto: UpdateBoardDto) {
    return this.boardsService.updateBoard(boardId, updateBoardDto);
  }

  @UseGuards(RefreshGuard, AccessGuard, AdminGuard, BoardAbilityGuard)
  @ApiOperation({ description: "게시물을 삭제합니다." })
  @Delete(":id")
  removeBoard(@Param("id") boardId: number) {
    return this.boardsService.removeBoard(boardId);
  }
}
