import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1718351073200 implements MigrationInterface {
    name = 'CreateUserTable1718351073200'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`User\` (\`id\` varchar(255) NOT NULL, \`email\` varchar(60) NOT NULL, \`password\` varchar(30) NOT NULL, \`type\` enum ('admin', 'member') NOT NULL DEFAULT 'member', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`User\``);
    }

}
