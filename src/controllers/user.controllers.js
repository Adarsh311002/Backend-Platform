import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary,deleteFromCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose";



const generateAccessAndRefreshToken = async (user_id) => {
    try {
        const user = await User.findById(user_id);
    
        if(!user){
            throw new ApiError(404, "User not found");
        }
    
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500, "Failed to generate access and refresh tokens");
    }

}


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


const loginUser = asyncHandler(async (req, res) => {
    //data from body
    const {email,username,password} = req.body;

    //validation

    if(!email){
        throw new ApiError(400,"Email is required")
    }

    const user = await User.findOne({
        $or : [{email},{username}]
    })

    if(!user){
        throw new ApiError(404,"User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid credentials")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggerInUser = await User.findById(user._id).select("-password -refreshToken")

    if(!loggerInUser){
        throw new ApiError(500,"Failed to login user")
    }

    const options = {
        httpOnly : true,
        secure : process.env.NODE_ENV === "production",
    }

    return res
    .status(200)
    .cookie("refreshToken",refreshToken,options)
    .cookie("accessToken",accessToken,options)
    .json(new ApiResponse(
        200,
        {user : loggerInUser, accessToken, refreshToken},
        "User logged in successfully"  
    ))



})

const refreshAccessToken = asyncHandler(async(req,res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(400,"Invalid refresh token")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiError(404,"Invalid refresh token")
        }

        if(incomingRefreshToken !== user.refreshToken){
            throw new ApiError(400,"Invalid refresh token")
        }

        const options = {
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
        }

        const {accessToken,refreshToken: newRefreshToken} = await generateAccessAndRefreshToken(user._id);

        return res
        .status(200)
        .cookie("refreshToken",newRefreshToken,options)
        .cookie("accessToken",accessToken,options)
        .json(new ApiResponse(
            200,
            {accessToken,refreshToken : newRefreshToken},
            "Access token refreshed successfully"
        ))


    } catch (error) {
        throw new ApiError(500,"Something went wrong while refreshing access token")     
    }
})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                refreshToken : undefined,
            }
        },
        {new : true}
    )

    const options = {httpOnly : true, secure : process.env.NODE_ENV === "production"}

    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json(new ApiResponse(200,{}, "User logged out successfully"))
})

const changeCurrentPassword = asyncHandler(async(req,res) => {
    const {OldPassword,newPassword} = req.body;

    const user = await User.findById(req.user?.id)

    const isPasswordValid = await user.isPasswordCorrect(OldPassword)

    if(!isPasswordValid){
        throw new ApiError(400,"Invalid password")
    }

    user.password = newPassword;

    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200,{}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async(req,res) => {
    return res.status(200).json(new ApiResponse(200,req.user,"User found successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res) => {

    const {fullname,email} = req.body;

    if(!fullname || !email){
        throw new ApiError(400,"Fullname and email are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname,
                email
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    if(!user){
        throw new ApiError(500,"Failed to update user details")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,user,"User details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {

    console.log("Request File:", req.file); 
    console.log("Request Body:", req.body);
    
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        console.error("Avatar file is missing");
        throw new ApiError(400,"Avatar file is missing")
    }

    console.log("Avatar Local Path:", avatarLocalPath);

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        console.error("Failed to upload avatar to Cloudinary");
        throw new ApiError(500,"Failed to upload avatar")
    }
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },{new : true}
    ).select("-password -refreshToken")

    if(!user){
        throw new ApiError(500,"Failed to update user avatar")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,user,"User avatar updated successfully"))

})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverLocalPath = req.file?.path;   // req.file?.path

    if(!coverLocalPath){
        throw new ApiError(400,"Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if(!coverImage.url){
        throw new ApiError(500,"Failed to upload cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage : coverImage.url
            }
        },{new : true}
    ).select("-password -refreshToken")

    if(!user){ 
        throw new ApiError(500,"Failed to update user cover image")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,user,"User cover image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params;

    if(!username?.trim()){
        throw new ApiError(400,"Username is required")
    }

    const channel = await User.aggregate([
        {
            $match : {
                username : username.toLowerCase()
            }
        },
        {
            $lookup : {
                from : "subscription",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscription",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if :{$in : [req.user?._id,"$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                fullname : 1,
                username : 1,
                avatar : 1,
                coverImage : 1,
                subscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1

            }
        }
    ])

    console.log("Channel: ",channel)

    if(!channel.length){
        throw new ApiError(404,"Channel not found")
    } 


     return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"Channel found successfully"))
})



const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [    
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                     $project : {
                                            fullname : 1,
                                            username : 1,
                                            avatar : 1
                                     }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"   
                            }
                        }
                    }
                ]
            }
        }
    ])

    if(!user.length){
        throw new ApiError(404,"User not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,user[0]?.watchHistory,"Watch history found successfully"))
})


export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    

}