require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/reclamos',  require('./routes/reclamos'));
app.use('/api/edificios', require('./routes/edificios'));
app.use('/api/usuarios',  require('./routes/usuarios'));

// Health check
app.get('/api/health', (_, res) => res.json({ ok: true }));

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));
