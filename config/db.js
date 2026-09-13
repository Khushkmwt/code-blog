import mongoose from "mongoose";
import { config } from "./index.js";
const DB_NAME = 'blog'


const connectDB = async () => {
    try {
        const rawUrl = config.dbUrl.replace(/\/$/, '');
        const hasDbName = /^(mongodb|mongodb\+srv):\/\/[^/]+\/[^/?]+/.test(rawUrl);
        const url = hasDbName ? rawUrl : `${rawUrl}/${DB_NAME}`;
        const connectionInstance = await mongoose.connect(url)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        console.log(` Mode: ${config.mode} | File storage: ${config.isProduction ? 'Cloudinary' : 'Local disk'}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB