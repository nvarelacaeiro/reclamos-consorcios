const router = require('express').Router();
const ctrl   = require('../controllers/usuariosController');
const { authMiddleware, soloAdmin } = require('../middleware/auth');

router.use(authMiddleware, soloAdmin);

router.get('/',               ctrl.listar);
router.post('/',              ctrl.crear);
router.patch('/:id/activo',   ctrl.toggleActivo);

module.exports = router;
