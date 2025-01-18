import { registerUser,logoutUser } from "../controllers/user.controllers.js";
import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import {jwtVerify} from "../middlewares/auth.middlewares.js";


const router = Router();

// Define the POST route for "/register"
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

// secure route

   router.route("/logout").post(jwtVerify,logoutUser);

export default router;
