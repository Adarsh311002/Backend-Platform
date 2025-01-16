import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    if ([fullname, username, email, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(400, "Username or email already exists");
    }

    console.log("req.files: ", req.files);

    // Ensure unique file names for avatar and coverImage
    const avatarFile = req.files?.avatar?.[0];
    const coverFile = req.files?.coverImage?.[0];

    if (!avatarFile) {
        throw new ApiError(409, "Avatar file is missing");
    }

    const avatarLocalPath = avatarFile.path;
    const coverLocalPath = coverFile?.path;

    console.log("Avatar local path: ", avatarLocalPath);
    console.log("Cover image local path: ", coverLocalPath);

    let avatar;
    try {
        console.log("Uploading avatar...");
        avatar = await uploadOnCloudinary(avatarLocalPath);
        console.log("Avatar uploaded successfully: ", avatar);
    } catch (error) {
        console.log("Error uploading avatar: ", error);
        throw new ApiError(500, "Failed uploading avatar");
    }

    let coverImage;
    try {
        if (coverLocalPath && coverLocalPath !== avatarLocalPath) {
            console.log("Uploading cover image...");
            coverImage = await uploadOnCloudinary(coverLocalPath);
            console.log("Cover image uploaded successfully: ", coverImage);
        } else {
            console.log("No cover image provided or cover image is the same as avatar. Skipping upload.");
        }
    } catch (error) {
        console.log("Error uploading cover image: ", error);
        throw new ApiError(500, "Failed uploading cover image");
    }

    try {
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        });

        const createdUser = await User.findById(user._id).select("-password -refreshToken");

        if (!createdUser) {
            throw new ApiError(500, "Something went wrong while registering the user");
        }

        return res
            .status(200)
            .json(new ApiResponse(200, createdUser, "User registered successfully"));
    } catch (error) {
        console.log("User creation failed: ", error);

        if (avatar) {
            await deleteFromCloudinary(avatar.public_id);
        }

        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id);
        }

        throw new ApiError(500, "Something went wrong while registering the user and images were deleted");
    }
});


export {
    registerUser
}