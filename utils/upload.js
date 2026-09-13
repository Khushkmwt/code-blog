import path from "path";
import fs from "fs";
import { config } from "../config/index.js";
import { uploadOnCloudinary } from "./cloudinary.js";

const uploadFile = async (localFilePath) => {
    if (!localFilePath) return null;

    if (config.isProduction) {
        return uploadOnCloudinary(localFilePath);
    }

    const dir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(dir, { recursive: true });
    const filename = path.basename(localFilePath);
    fs.renameSync(localFilePath, path.join(dir, filename));
    return { url: `/uploads/${filename}` };
};

export { uploadFile };