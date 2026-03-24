const router = require('express').Router();
const ctrl   = require('../controllers/edificiosController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/',                  ctrl.listar);
router.get('/:id/unidades',      ctrl.unidadesPorEdificio);

module.exports = router;
