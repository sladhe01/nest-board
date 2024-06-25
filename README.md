## 설명

이 프로젝트는 NestJS를 이용하여 게시판 기능을 만들었습니다.
회원가입 및 로그인, 게시판과 댓글의 작성, 조회, 수정, 삭제 기능을 사용 할 수 있습니다.

## 설치

```bash
$ git clone https://github.com/sladhe01/nest-board.git
$ cd nest-board
$ npm install
```

## 환경변수 설정

```bash
$ cp src/config/env/development.env.template src/config/env/development.env
```

development.env에 환경변수를 설정 해주세요.

## 실행

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## API 문서

Swagger를 사용하여 API 문서를 제공합니다.
서버를 시작한 후 다음 URL을 통해 API 문서에 접근할 수 있습니다.
localhost:3000/api-docs

## 기술 스택

NestJS
Typescript
MySQL
TypeORM
AWS EC2
AWS S3
Docker

## License

이 프로젝튼는 MIT license를 따르고 있습니다.
