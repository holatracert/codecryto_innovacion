const express = require('express');
const router = express.Router();
const didController = require('../controllers/did.controller');
const { validateDidCreation, validateDidUpdate } = require('../middleware/validation');

// Rutas para gestión de DIDs
router.post('/', validateDidCreation, didController.createDid);
router.get('/', didController.getAllDids);
router.get('/search', didController.searchDids);
router.get('/stats', didController.getDidStats);

// Rutas para DIDs específicos
router.get('/:id', didController.getDidById);
router.get('/did/:did', didController.getDidByDid);
router.put('/:id', validateDidUpdate, didController.updateDid);
router.delete('/:id', didController.deleteDid);

// Rutas para aprobación/rechazo
router.post('/:id/approve', didController.approveDid);
router.post('/:id/reject', didController.rejectDid);

// Rutas para DIDs por propietario
router.get('/owner/:owner_address', didController.getDidsByOwner);

module.exports = router;
