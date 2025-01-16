import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
import dotenv from "dotenv";

dotenv.config()

cloudinary.config({ 
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Wait for the upload to complete
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        console.log("File uploaded on cloudinary. File src: ", response.url);

        // Delete the local file only if it's not being used elsewhere
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return response;
    } catch (error) {
        console.log("Error uploading file on cloudinary: ", error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw error; // Rethrow the error to handle it in the calling function
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        const result  = await cloudinary.uploader.destroy(publicId)
        console.log("File deleted from cloudinary",result)
    } catch (error) {
        console.log("Error deleting file from cloudinary",error)
        return null            
    }

}

export { uploadOnCloudinary,deleteFromCloudinary }