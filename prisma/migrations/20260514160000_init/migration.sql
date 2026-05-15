-- CreateTable
CREATE TABLE `dim_rubro` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(8) NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `fuente_codigo` VARCHAR(4) NOT NULL,
    `fuente_nombre` VARCHAR(100) NOT NULL,
    `nombre_corto` VARCHAR(20) NOT NULL,
    `descripcion` TEXT NULL,

    UNIQUE INDEX `uk_rubro_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dim_clasificador_gasto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(20) NOT NULL,
    `codigo_padre` VARCHAR(20) NULL,
    `nivel` TINYINT NOT NULL,
    `descripcion` VARCHAR(300) NOT NULL,
    `descripcion_detallada` TEXT NULL,
    `restringido` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `uk_clasif_codigo`(`codigo`),
    INDEX `idx_clasif_padre`(`codigo_padre`),
    INDEX `idx_clasif_nivel`(`nivel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dim_unidad_organica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nivel` TINYINT NOT NULL,
    `padre_id` INTEGER NULL,
    `nombre` VARCHAR(200) NOT NULL,
    `nombre_corto` VARCHAR(50) NULL,
    `ruta` VARCHAR(800) NOT NULL,
    `ruta_nombres` VARCHAR(1000) NOT NULL,

    INDEX `idx_uo_padre`(`padre_id`),
    INDEX `idx_uo_nivel`(`nivel`),
    INDEX `idx_uo_ruta`(`ruta`(255)),
    UNIQUE INDEX `uk_uo_nivel_padre_nombre`(`nivel`, `padre_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dim_programa_pptal` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(8) NOT NULL,
    `nombre` VARCHAR(200) NOT NULL,

    UNIQUE INDEX `uk_pp_codigo`(`codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dim_funcion` (
    `id` SMALLINT NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(8) NOT NULL,
    `nombre` VARCHAR(150) NOT NULL,
    `division_codigo` VARCHAR(8) NULL,
    `division_nombre` VARCHAR(150) NULL,
    `grupo_codigo` VARCHAR(8) NULL,
    `grupo_nombre` VARCHAR(150) NULL,

    UNIQUE INDEX `uk_func`(`codigo`, `division_codigo`, `grupo_codigo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dim_meta` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ano_eje` SMALLINT NOT NULL,
    `meta` INTEGER NOT NULL,
    `sec_func` INTEGER NOT NULL,
    `finalidad_codigo` VARCHAR(10) NOT NULL,
    `finalidad_nombre` TEXT NOT NULL,
    `tipo_prod_proy` ENUM('PRODUCTO', 'PROYECTO') NOT NULL,
    `producto_proyecto_codigo` VARCHAR(10) NOT NULL,
    `producto_proyecto_nombre` TEXT NOT NULL,
    `cui` VARCHAR(10) NULL,
    `programa_pptal_id` SMALLINT NULL,
    `funcion_id` SMALLINT NULL,
    `unidad_organica_id` INTEGER NOT NULL,
    `nombre_corto` VARCHAR(150) NULL,

    INDEX `idx_meta_cui`(`cui`),
    INDEX `idx_meta_uo`(`unidad_organica_id`),
    INDEX `idx_meta_pp`(`programa_pptal_id`),
    UNIQUE INDEX `uk_meta`(`ano_eje`, `meta`, `sec_func`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `nombre_completo` VARCHAR(150) NOT NULL,
    `rol` ENUM('SUPER_ADMIN', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `ultimo_acceso` DATETIME(3) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actualizado_en` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_usuario_username`(`username`),
    UNIQUE INDEX `uk_usuario_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cargas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ano_eje` SMALLINT NOT NULL,
    `nombre_archivo` VARCHAR(255) NOT NULL,
    `hash_archivo` CHAR(64) NOT NULL,
    `total_filas` INTEGER NOT NULL DEFAULT 0,
    `total_registros` INTEGER NOT NULL DEFAULT 0,
    `estado` ENUM('PROCESANDO', 'EXITOSA', 'FALLIDA') NOT NULL DEFAULT 'PROCESANDO',
    `es_vigente` BOOLEAN NOT NULL DEFAULT false,
    `mensaje_error` TEXT NULL,
    `usuario_id` INTEGER NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `procesado_en` DATETIME(3) NULL,

    INDEX `idx_carga_vigente`(`ano_eje`, `es_vigente`),
    INDEX `idx_carga_estado`(`estado`),
    UNIQUE INDEX `uk_carga_hash`(`hash_archivo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hechos_ejecucion` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `carga_id` INTEGER NOT NULL,
    `ano_eje` SMALLINT NOT NULL,
    `mes` TINYINT NOT NULL,
    `meta_id` INTEGER NOT NULL,
    `rubro_id` SMALLINT NOT NULL,
    `clasificador_id` INTEGER NOT NULL,
    `categoria_gasto` ENUM('CORRIENTE', 'CAPITAL', 'SERVICIO_DEUDA') NOT NULL,
    `mto_pia` DECIMAL(16, 2) NOT NULL DEFAULT 0,
    `mto_modificaciones` DECIMAL(16, 2) NOT NULL DEFAULT 0,
    `mto_pim` DECIMAL(16, 2) NOT NULL DEFAULT 0,
    `mto_certificado` DECIMAL(16, 2) NOT NULL DEFAULT 0,
    `mto_compromiso_anual` DECIMAL(16, 2) NOT NULL DEFAULT 0,
    `mto_compromiso_mes` DECIMAL(16, 2) NOT NULL DEFAULT 0,
    `mto_devengado` DECIMAL(16, 2) NOT NULL DEFAULT 0,
    `mto_girado` DECIMAL(16, 2) NOT NULL DEFAULT 0,
    `mto_pagado` DECIMAL(16, 2) NOT NULL DEFAULT 0,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_hecho_carga_mes`(`carga_id`, `ano_eje`, `mes`),
    INDEX `idx_hecho_meta`(`meta_id`),
    INDEX `idx_hecho_rubro`(`rubro_id`),
    INDEX `idx_hecho_clasif`(`clasificador_id`),
    INDEX `idx_hecho_categoria`(`categoria_gasto`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auditoria` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `usuario_id` INTEGER NULL,
    `accion` ENUM('LOGIN', 'LOGOUT', 'CARGA_CREADA', 'CARGA_RESTAURADA', 'CARGA_ELIMINADA', 'USUARIO_CREADO', 'USUARIO_ACTUALIZADO', 'USUARIO_DESACTIVADO') NOT NULL,
    `entidad` VARCHAR(80) NULL,
    `entidad_id` VARCHAR(80) NULL,
    `detalle` JSON NULL,
    `ip` VARCHAR(45) NULL,
    `user_agent` VARCHAR(300) NULL,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_auditoria_usuario`(`usuario_id`),
    INDEX `idx_auditoria_accion`(`accion`),
    INDEX `idx_auditoria_fecha`(`creado_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `intentos_login` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `ip` VARCHAR(45) NOT NULL,
    `username` VARCHAR(50) NULL,
    `exitoso` BOOLEAN NOT NULL DEFAULT false,
    `creado_en` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_intento_login_ip_fecha`(`ip`, `creado_en`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dim_unidad_organica` ADD CONSTRAINT `dim_unidad_organica_padre_id_fkey` FOREIGN KEY (`padre_id`) REFERENCES `dim_unidad_organica`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dim_meta` ADD CONSTRAINT `dim_meta_programa_pptal_id_fkey` FOREIGN KEY (`programa_pptal_id`) REFERENCES `dim_programa_pptal`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dim_meta` ADD CONSTRAINT `dim_meta_funcion_id_fkey` FOREIGN KEY (`funcion_id`) REFERENCES `dim_funcion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dim_meta` ADD CONSTRAINT `dim_meta_unidad_organica_id_fkey` FOREIGN KEY (`unidad_organica_id`) REFERENCES `dim_unidad_organica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cargas` ADD CONSTRAINT `cargas_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hechos_ejecucion` ADD CONSTRAINT `hechos_ejecucion_carga_id_fkey` FOREIGN KEY (`carga_id`) REFERENCES `cargas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hechos_ejecucion` ADD CONSTRAINT `hechos_ejecucion_meta_id_fkey` FOREIGN KEY (`meta_id`) REFERENCES `dim_meta`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hechos_ejecucion` ADD CONSTRAINT `hechos_ejecucion_rubro_id_fkey` FOREIGN KEY (`rubro_id`) REFERENCES `dim_rubro`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `hechos_ejecucion` ADD CONSTRAINT `hechos_ejecucion_clasificador_id_fkey` FOREIGN KEY (`clasificador_id`) REFERENCES `dim_clasificador_gasto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `auditoria` ADD CONSTRAINT `auditoria_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
