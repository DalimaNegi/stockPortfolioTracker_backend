const { indexFetch } = require('../controllers/DataController');
const authMiddleware = require('../middleware/AuthCheck');


const router = require('express').Router();

 
router.get('/index', authMiddleware, indexFetch)
//router.post('/predict', authMiddleware, predict)

module.exports = router