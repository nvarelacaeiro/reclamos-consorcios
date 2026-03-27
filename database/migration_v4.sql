-- ============================================================
-- Migration v4 — Reclamos Consorcios
-- Proveedores + proveedor_id en reclamos
-- ============================================================

-- 1. Crear tabla proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nombre     VARCHAR(150) NOT NULL,
  rubro      VARCHAR(100) DEFAULT NULL,
  telefono   VARCHAR(30)  DEFAULT NULL,
  notas      TEXT         DEFAULT NULL,
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Agregar proveedor_id a reclamos
ALTER TABLE reclamos ADD COLUMN proveedor_id INT DEFAULT NULL AFTER tipo_id;
ALTER TABLE reclamos ADD CONSTRAINT fk_reclamo_proveedor
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL;
