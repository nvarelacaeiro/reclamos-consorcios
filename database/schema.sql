-- ============================================================
-- Reclamos Consorcios - Schema MySQL
-- ============================================================

CREATE DATABASE IF NOT EXISTS reclamos_consorcios CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE reclamos_consorcios;

-- ------------------------------------------------------------
-- Usuarios internos (equipo de administración)
-- ------------------------------------------------------------
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'operador') NOT NULL DEFAULT 'operador',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Edificios administrados
-- ------------------------------------------------------------
CREATE TABLE edificios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------
-- Unidades dentro de cada edificio
-- ------------------------------------------------------------
CREATE TABLE unidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    edificio_id INT NOT NULL,
    numero VARCHAR(20) NOT NULL,
    piso VARCHAR(10),
    FOREIGN KEY (edificio_id) REFERENCES edificios(id) ON DELETE CASCADE,
    UNIQUE KEY uq_edificio_unidad (edificio_id, numero)
);

-- ------------------------------------------------------------
-- Tipos de reclamo
-- ------------------------------------------------------------
CREATE TABLE tipos_reclamo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- ------------------------------------------------------------
-- Reclamos
-- repeticiones: cantidad de reportes del mismo problema abierto
-- grupo_reclamo_id: apunta al primer reclamo del grupo
-- ------------------------------------------------------------
CREATE TABLE reclamos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    edificio_id INT NOT NULL,
    unidad_id INT,
    tipo_id INT NOT NULL,
    estado ENUM('abierto', 'en_proceso', 'resuelto', 'cerrado') NOT NULL DEFAULT 'abierto',
    prioridad ENUM('baja', 'media', 'alta', 'urgente') NOT NULL DEFAULT 'media',
    repeticiones INT NOT NULL DEFAULT 1,
    es_repetido TINYINT(1) NOT NULL DEFAULT 0,
    grupo_reclamo_id INT DEFAULT NULL,
    creado_por INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (edificio_id) REFERENCES edificios(id),
    FOREIGN KEY (unidad_id)   REFERENCES unidades(id),
    FOREIGN KEY (tipo_id)     REFERENCES tipos_reclamo(id),
    FOREIGN KEY (creado_por)  REFERENCES usuarios(id),
    INDEX idx_estado   (estado),
    INDEX idx_edificio (edificio_id),
    INDEX idx_tipo     (tipo_id),
    INDEX idx_grupo    (grupo_reclamo_id)
);

-- ------------------------------------------------------------
-- Historial de cambios de estado
-- ------------------------------------------------------------
CREATE TABLE historial_reclamos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reclamo_id INT NOT NULL,
    estado_anterior ENUM('abierto', 'en_proceso', 'resuelto', 'cerrado'),
    estado_nuevo ENUM('abierto', 'en_proceso', 'resuelto', 'cerrado') NOT NULL,
    nota TEXT,
    usuario_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reclamo_id) REFERENCES reclamos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ============================================================
-- Datos iniciales
-- ============================================================

INSERT INTO tipos_reclamo (nombre) VALUES
    ('Humedad / Filtraciones'),
    ('Ascensor'),
    ('Iluminación'),
    ('Limpieza'),
    ('Gas / Calefacción'),
    ('Agua / Plomería'),
    ('Seguridad / Portero'),
    ('Ruidos molestos'),
    ('Estructura / Obra'),
    ('Otro');

INSERT INTO edificios (nombre, direccion) VALUES
    ('Torre Norte', 'Av. Corrientes 1234, CABA'),
    ('Residencial Sur', 'Calle Falsa 567, CABA'),
    ('Complejo Centro', 'Lavalle 890, CABA');

INSERT INTO unidades (edificio_id, numero, piso) VALUES
    (1, '1A', '1'), (1, '1B', '1'), (1, '2A', '2'), (1, '2B', '2'),
    (1, '3A', '3'), (1, '3B', '3'), (1, 'PH', 'PH'),
    (2, '1',  '1'), (2, '2',  '1'), (2, '3',  '2'), (2, '4',  '2'),
    (3, '101','1'), (3, '102','1'), (3, '201','2'), (3, '202','2');

-- Usuario admin por defecto  (password: Admin1234)
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
    ('Administrador', 'admin@consorcio.com',
     '$2b$10$Y9K8v2zQpXwLmNjRtUeOsOQkF1HvZCdGbA3sW7xPnYqIMoE6uDl3i',
     'admin');
