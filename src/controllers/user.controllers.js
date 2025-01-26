import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser=asyncHandler(async (req,res)=>{
  console.log("Request Files : ",req.files);
  console.log("Request body : ",req.body);

  // 1.get user details from frontend 
      const {fullname,email,username,password}=req.body;
      // console.log(`Fullname : ${fullname} email :${email}`);

  // 2.validation - not empty

        /* we also do same for all fields that check the are empty or not ?
            if(fullname===""){
            throw new ApiError(400,"full name is required")
          }*/

        if(
          [fullname,email,username,password].some((field)=>field?.trim()==="")
        ){
          throw new ApiError(400,"All fields are required")
        }

  // 3.check if user already exists :username,email
        const existedUser=await User.findOne({
          $or:[{username},{email}]
        })

        if(existedUser){
          throw new ApiError(409,"User already exists with username or email")
        }
  // 4.check for images ,avator

        const avatorLocalPath=req.files?.avator?.[0]?.path;
        // const coverImageLocalPath=req.files?.coverImage[0]?.path;

        let coverImageLocalPath;
        if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
       {
          coverImageLocalPath = req.files.coverImage[0].path
      }

      
        if(!avatorLocalPath)
          {throw new ApiError(400,"Avator file is required");}

  // 5.upload on cloudinary
      const avator=await  uploadOnCloudinary(avatorLocalPath);
     const coverImage=  coverImageLocalPath
     ? await uploadOnCloudinary(coverImageLocalPath)
     : null;
     
     if(!avator){throw new ApiError(400,"Avator file is required");}
     
        
  // 6.create user object - crate entry in db
  const user=await User.create({
    fullname,
    avator:avator.url,
    coverImage:coverImage?.url || "",
    email,password,
    username:username.toLowerCase(),
  });


  // 7.remove password and refresh token field from response
  const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
  )
   // 8. check for user creation 
  if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user !")
  }

  // 9.return response
  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully ! ")
  )
 

})

export {registerUser}