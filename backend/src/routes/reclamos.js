const router = require('express').Router();
const ctrl   = require('../controllers/reclamosController');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/tipos',        ctrl.listarTipos);
router.get('/stats',        ctrl.stats);
router.get('/operadores',   ctrl.listarOperadores);
router.get('/',             ctrl.listar);
router.get('/:id',          ctrl.obtener);
router.post('/',            ctrl.crear);
router.put('/:id',          ctrl.actualizar);
router.delete('/:id',       ctrl.eliminar);
router.patch('/:id/estado', ctrl.cambiarEstado);

module.exports = router;
