-- Migration v5: Operador asignado en reclamos
-- Ejecutar en Railway MySQL Data viewer

ALTER TABLE reclamos ADD COLUMN asignado_a INT NULL;
ALTER TABLE reclamos ADD CONSTRAINT fk_reclamos_asignado_a FOREIGN KEY (asignado_a) REFERENCES usuarios(id) ON DELETE SET NULL;
