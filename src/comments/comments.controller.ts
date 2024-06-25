import { Controller, Post, Body, Patch, Param, Delete, UseGuards, Req } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { UpdateCommentDto } from "./dto/update-comment.dto";
import { AccessGuard, RefreshGuard } from "src/shared/guards/auth.guard";
import { CommentAbilityGuard } from "src/shared/guards/ability.guard";
import { ApiTags, ApiOperation, ApiBody } from "@nestjs/swagger";

@Controller("comments")
@ApiTags("댓글")
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(RefreshGuard, AccessGuard)
  @Post()
  @ApiOperation({ description: "댓글을 생성합니다." })
  @ApiBody({
    schema: {
      type: "object",
      properties: { content: { type: "string" }, boardId: { type: "number" }, parentCommentId: { type: "number" } },
    },
  })
  create(@Body() createCommentDto: CreateCommentDto, @Req() req) {
    const authorEmail = req.user.email;
    return this.commentsService.createComment(createCommentDto, authorEmail);
  }

  @UseGuards(RefreshGuard, AccessGuard, CommentAbilityGuard)
  @ApiOperation({ description: "댓글을 수정합니다." })
  @ApiBody({
    schema: {
      type: "object",
      properties: { content: { type: "string" } },
    },
  })
  @Patch(":id")
  update(@Param("id") commentId: number, @Body() updateCommentDto: UpdateCommentDto) {
    return this.commentsService.updateComment(commentId, updateCommentDto);
  }

  @UseGuards(RefreshGuard, AccessGuard, CommentAbilityGuard)
  @ApiOperation({ description: "댓글을 삭제합니다." })
  @Delete(":id")
  async removeComment(@Param("id") id: number) {
    return this.commentsService.removeComment(id);
  }
}
