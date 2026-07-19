// routes/marketRoutes.js
const router = require('express').Router();
const { getStockInfoYahoo, chartPull, financialData } = require('../controllers/MarketController');
const authMiddleware = require('../middleware/AuthCheck');

router.get('/info/:symbol', authMiddleware ,getStockInfoYahoo);


router.post('/chart', authMiddleware, chartPull )
// Financial Analytics (Revenue/ROE/ROA) removed from the Market page — route disabled.
// router.post('/fininfo', authMiddleware, financialData )

module.exports = router;
