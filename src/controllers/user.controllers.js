import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req,res) => {
    //TODO
    const {fullName,email,username,password} = req.body;

    //validation

    if(
        [fullName,username,email,password].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required");
    }

    const existedUser = await User.findOne({
        $or : [{username},{email}]
    })

    if(existedUser){
        throw new ApiError(400,"Username or email already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new ApiError(409,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    let coverImage = ""

    if(coverLocalPath){
        coverImage = await uploadOnCloudinary(coverLocalPath)
    }

    const user = User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,createdUser,"User registered successfully"))
})


export {
    registerUser
}