import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNombreColumn1723456789012 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Borrar vista dependiente
    await queryRunner.query(`DROP VIEW IF EXISTS vista_residentes_completa`);

    // 2. Borrar columna
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS nombre`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurar columna si haces rollback
    await queryRunner.query(`ALTER TABLE users ADD COLUMN nombre varchar`);

    // Restaurar vista (ajusta tu consulta real)
    await queryRunner.query(`
      CREATE VIEW vista_residentes_completa AS
      SELECT * FROM users;
    `);
  }
}

