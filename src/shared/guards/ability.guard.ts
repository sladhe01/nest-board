import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { BoardsService } from "../../boards/boards.service";
import multer from "multer";
import { FilesService } from "../../files/files.service";
import { CommentsService } from "src/comments/comments.service";

@Injectable()
export class AdminGuard implements CanActivate {
  constructor() {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    await new Promise((resolve, reject) => {
      multer().any()(request, undefined, function (err) {
        if (err) reject(err);
        resolve(request);
      });
    });
    const { type } = request.user;
    if (type !== "admin" && request.body.category === "notice") {
      throw new UnauthorizedException("Only admin permitted");
    }
    return true;
  }
}

@Injectable()
export class BoardAbilityGuard implements CanActivate {
  constructor(
    private boardsService: BoardsService,
    private filesService: FilesService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const boardId = request.params.id;
    const authorEmail = await this.boardsService.getAuthorByBoardId(boardId);
    if (authorEmail !== request.user.email) {
      throw new UnauthorizedException("Not permmited");
    }
    if (request.user.type === "admin" && request.method === "DELETE") {
      return true;
    }
    const deletingFileIds = request.body.deletingFileIds;
    if (deletingFileIds && deletingFileIds.length !== 0) {
      deletingFileIds.forEach(async (id) => {
        const fileOnwer = await this.filesService.getFilesOwnerById(id);
        if (fileOnwer !== authorEmail) throw new UnauthorizedException("No access to file");
      });
    }
    return true;
  }
}

@Injectable()
export class CommentAbilityGuard implements CanActivate {
  constructor(private commentsService: CommentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const commentId = request.params.id;
    const authorEmail = await this.commentsService.getAuthorById(commentId);
    if (authorEmail !== request.user.email) {
      throw new UnauthorizedException("Not permmited");
    }
    return true;
  }
}
