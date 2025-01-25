import {asyncHandler} from "../utils/asyncHandler.js";

const registerUser=asyncHandler(async (req,res)=>{
   res.status(200).json({
        message:"bhai postman var aalo na !"
    })
    res.send("bhai connected")
})

export {registerUser}