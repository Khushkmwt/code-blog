import {app} from './app.js'
import dotenv from 'dotenv'
import connectDB from './db/index.js'
import { config } from './utils/config.js'
dotenv.config({
    path: './.env'
})

connectDB()
.then(() => {
    app.listen(config.port, () => {
        console.log(`⚙️ Server is running at port : ${config.port} (${config.mode})`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})
