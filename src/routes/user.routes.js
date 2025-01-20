import { registerUser,logoutUser, loginUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, getUserChannelProfile, updateAccountDetails } from "../controllers/user.controllers.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import {jwtVerify} from "../middlewares/auth.middlewares.js";


const router = Router();

// Define the POST route for "/register"
// unsecured routes
router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    // (req, res, next) => {
    //     console.log("Request body:", req.body);
    //     console.log("Uploaded files:", req.files);
    //     next(); // Pass control to the next middleware (registerUser)
    // },
    registerUser
);  

router.route("/login").post(loginUser)
router.route("/refresh-token").post(refreshAccessToken)

// secured route

   router.route("/logout").post(jwtVerify,logoutUser);
   router.route("/change-password").post(jwtVerify,changeCurrentPassword)
   router.route("/current-user").get(jwtVerify,getCurrentUser)
   //params use here
   router.route("/c/:username").get(jwtVerify,getUserChannelProfile)

   //
   router.route("/update-account").patch(jwtVerify,updateAccountDetails)
   

export default router;
