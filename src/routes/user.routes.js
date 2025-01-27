import {Router} from "express";
import { registerUser,loginUser,logoutUser, refreshAccessToken} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from "../middlewares/auth.middleware.js"

const router=Router();

// applying upload middleware 
router.route("/register").post(
    upload.fields([
        {
            name:"avator",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ])
    ,registerUser)

router.route("/login").post(loginUser)

// secured notes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)
export default router;

