-- AlterEnum
ALTER TABLE `auditoria` MODIFY `accion` ENUM('LOGIN', 'LOGOUT', 'CARGA_CREADA', 'CARGA_RESTAURADA', 'CARGA_ELIMINADA', 'REPORTE_CREADO', 'REPORTE_ELIMINADO', 'USUARIO_CREADO', 'USUARIO_ACTUALIZADO', 'USUARIO_DESACTIVADO') NOT NULL;

-- CreateTable
CREATE TABLE `reportes_documentos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titulo` VARCHAR(180) NOT NULL,
    `descripcion` TEXT NULL,
    `nombre_archivo` VARCHAR(255) NOT NULL,
    `ruta_publica` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(80) NOT NULL,
    `tamano_bytes` INTEGER NOT NULL,
    `publicado` BOOLEAN NOT NULL DEFAULT true,
    `usuario_id` INTEGER NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    INDEX `idx_reporte_publicado_fecha`(`publicado`, `creado_en`),
    INDEX `idx_reporte_usuario`(`usuario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reportes_documentos` ADD CONSTRAINT `reportes_documentos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
