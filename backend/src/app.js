require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// En producción, FRONTEND_URL puede ser "https://tu-app.vercel.app"
// Si no está definida, permite todos los orígenes (útil en desarrollo)
const corsOrigin = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
  : true;

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/reclamos',   require('./routes/reclamos'));
app.use('/api/edificios',  require('./routes/edificios'));
app.use('/api/usuarios',   require('./routes/usuarios'));
app.use('/api/proveedores', require('./routes/proveedores'));
app.use('/api/categorias',  require('./routes/categorias'));

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true }));

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Backend corriendo en puerto ${PORT}`));
