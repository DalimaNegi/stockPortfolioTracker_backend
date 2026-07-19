const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI

console.log("MONGO_URI:", process.env.MONGO_URI);

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
.then(
    ()=>{
        console.log('Database is Connected Successfully ...')
    }
).catch((err)=>{
    console.log("Error: Failed to Connect MongoDB", err)
    process.exit(1)
})