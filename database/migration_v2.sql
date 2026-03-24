-- ============================================================
-- Migration v2 — Reclamos Consorcios
-- ============================================================

-- 1. Agregar columna unidad_texto para texto libre en reclamos
ALTER TABLE reclamos
  ADD COLUMN unidad_texto VARCHAR(30) DEFAULT NULL AFTER unidad_id;

-- 2. Actualizar contraseña del admin a "Consorcios2024!" (bcrypt)
UPDATE usuarios
SET password_hash = '$2b$10$jy9BP/ftGoGR69uxaPXdYuWffc.uHWw4FDosxeuHglOitsg2qLGQC'
WHERE email = 'admin@consorcio.com';
