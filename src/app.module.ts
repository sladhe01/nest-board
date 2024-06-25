import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { UsersModule } from "./users/users.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { authConfig } from "./config/authConfig";
import { validationSchema } from "./config/validationSchema";
import { BoardsModule } from "./boards/boards.module";
import { s3Config } from "./config/s3Config";
import { FilesModule } from "./files/files.module";
import { CommentsModule } from "./comments/comments.module";

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      envFilePath: [`${__dirname}/config/env/${process.env.NODE_ENV}.env`],
      load: [authConfig, s3Config],
      isGlobal: true,
      validationSchema,
    }),
    TypeOrmModule.forRoot({
      type: "mysql",
      host: process.env.DATABASE_HOST,
      port: Number(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: process.env.DATABASE_SYNCHRONIZE === "true",
      migrationsRun: false,
      migrations: [__dirname + "**/migrations/*.js"],
    }),
    BoardsModule,
    FilesModule,
    CommentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
