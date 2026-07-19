const { register, login, refreshToken, logout, verify } = require('../controllers/AuthController');
const { signupValidation, loginValidation } = require('../middleware/AuthValidation');

const router = require('express').Router();

 
router.post('/login', loginValidation, login)

router.post('/register', signupValidation, register )

router.post('/refresh', refreshToken);

router.post('/logout', logout);

router.post('/verify', verify)

module.exports = router