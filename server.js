require('dotenv').config()

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const AuthRouter = require('./routes/AuthRouter')
const DataRouter = require('./routes/DataRouter')
const UserRouter = require('./routes/UserRouter')
const cookieParser = require('cookie-parser')
const MarketRouter = require('./routes/MarketRouter'); 
const quoteCache = require('./utils/Cache')


require('./utils/Database')
require('./jobs/fetchIndex');


const PORT = process.env.PORT || 8000

app.use(bodyParser.json())
app.use(cookieParser())

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.get('/', (req, res) => {
    res.send('Stock Portfolio API is running 🚀');
});

app.use('/auth', AuthRouter)
app.use('/data', DataRouter)
app.use('/market', MarketRouter);
app.use('/user',UserRouter)


app.listen(PORT, () => {
    console.log(`Server is running on Port ${PORT}`)
})