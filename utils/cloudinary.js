import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import { config } from "./config.js"


if (config.cloudinary) {
  cloudinary.config({ 
    cloud_name: config.cloudinary.cloudName, 
    api_key: config.cloudinary.apiKey, 
    api_secret: config.cloudinary.apiSecret 
  });
}

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}