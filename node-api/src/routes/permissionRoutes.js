const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

// List
router.get('/', permissionController.list);
// Get single
router.get('/:id', permissionController.get);
// Create
router.post('/', permissionController.create);
// Update
router.put('/:id', permissionController.update);
// Delete
router.delete('/:id', permissionController.remove);

module.exports = router;
