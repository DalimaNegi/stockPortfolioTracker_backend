const { getUserStocks, addUserStocks, getUserWatchlist, addUserWatchlist } = require('../controllers/UserController');
const authMiddleware = require('../middleware/AuthCheck');


const router = require('express').Router();


router.get('/stocks', authMiddleware, getUserStocks)
router.post('/stocks', authMiddleware, addUserStocks)

router.get('/watchlist', authMiddleware, getUserWatchlist)
router.post('/watchlist', authMiddleware, addUserWatchlist)



module.exports = router