-- ============================================================
-- Migration v3 — Reclamos Consorcios
-- Edificio como texto libre
-- ============================================================

-- 1. Hacer edificio_id nullable (el FK permite NULL en MySQL)
ALTER TABLE reclamos MODIFY COLUMN edificio_id INT NULL;

-- 2. Agregar columna de texto libre para el edificio
ALTER TABLE reclamos ADD COLUMN edificio_texto VARCHAR(150) DEFAULT NULL AFTER edificio_id;
