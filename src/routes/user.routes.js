import {Router} from "express";
import { registerUser } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";

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
export default router;