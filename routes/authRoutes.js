const express = require('express');
const { register, login } = require('../controllers/authController');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.post('/register', validate('userRegister'), register);
router.post('/login', validate('userLogin'), login);

module.exports = router;