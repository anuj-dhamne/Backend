import {asyncHandler} from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessAndRefreshToken = async(userId)=>{
  try {
    const user = await User.findById(userId);
    const accessToken=user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken=refreshToken;
   await user.save({ validateBeforeSave:false });

   return {accessToken,refreshToken};


  } catch (error) {
    throw new ApiError(404,"Something went wrong while generating the token")
  }
}

const registerUser=asyncHandler(async (req,res)=>{

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

const loginUser=asyncHandler(async (req,res)=>{

  /* 
    1.get user data / req body -> data
    2.validate it 
    3.login 
    4.if access-token is live then kept user authenticated
    5.if not then check refresh-token 
    6. refresh token is expired then , validate between user's refresh token with refreshtoken stored in database  
  */
 const {email ,username,password}=req.body;
 console.log(req.body);

 if(!(username  ||email)){
  throw new ApiError(400,"username or email is required");
 }

  const user=await User.findOne({
  $or :[{ username },{ email}]
 })

 if(!user){
    throw new ApiError(404,"User not exists")
 }

const isPasswordValid= await user.isPasswordCorrect(password)

if(!isPasswordValid){
  throw new ApiError(401,"Incorrect Password");
}

const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);

const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

const options={
  httpOnly:true,
  secure:true,
}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
  new ApiResponse(200,
    {user : loggedInUser,accessToken,refreshToken},
    "Successfully login ! "
  )
)

})

const logoutUser=asyncHandler(async (req,res)=>{
 await User.findByIdAndUpdate(
    req.user._id,
  {
    $unset:{
      refreshToken:1
    }
  },{
    new :true
  }
  )

  const options={
    httpOnly:true,
    secure:true,
  }

  return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"User Logout successfully !"))
})

const refreshAccessToken = asyncHandler(async (req,res)=>{
   const incomingRefreshToken=req.cookie.refreshToken || req.body.refreshToken;

   if(!incomingRefreshToken){
    throw new ApiError(401 ," Unauthorised request ! ");
   }

   try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 
    const user=await User.findById(decodedToken._id)
 
    if(!user){
     throw new ApiError(401,"Invalid refresh token");
    }
    if(incomingRefreshToken!==user?.refreshToken){
     throw new ApiError(401,"Refresh token is expired !");
    }
 
   const options={
     httpOnly:true,
     secure:true
   }
   
  const {accessToken,newRefreshToken}=await generateAccessAndRefreshToken(user._id) 
 
  return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
   new ApiResponse(200,{accessToken,newRefreshToken},"Access token refresh")
  )
   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token ! ");
   }
})

const changeCurrentPassword=asyncHandler(async (req,res)=>{
  const {oldPassword,newPassword}=req.body;

  const user=await User.findById(req.user?._id)

  const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);

  if(!isPasswordCorrect){
    throw new ApiError(401,"The password is Incorrect ! ");
  }
  user.password=newPassword;
 await user.save({validateBeforeSave :false});

return res.status(200).json(new ApiResponse (200,{},"Password Change Successfully ! "))
  
})

const getCurrentUser=asyncHandler(async (req,res)=>{
 return res.status(200).json(new ApiResponse(200 ,req.user,"current user fetched successfully"));
})

const updateAccountDetails =asyncHandler(async (req,res)=>{
  const {fullname,email}=req.body;

  if(!fullname ||!email){
    throw new ApiError(400,"All fields are required ! ");
  }

  const user =await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        fullname,email
      }
    },
    {
      new :true
    }

  ).select("-password");

  return res.status(200)
            .json(new ApiResponse(
              200,
              user,
              "Details updated Successfully "
            ))
})

const updateUserAvator=asyncHandler(async (req,res)=>{

  const avatorLocalPath=req.file?.path;
  if(!avatorLocalPath){
    throw new ApiError(400,"Avator file required ! ")
  }
  const avator=await uploadOnCloudinary(avatorLocalPath);

  if(!avator.url){
    throw new ApiError(400,"Error required for uploading on avator ! ")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{avator:avator.url}
    },
    {
      new:true,
    }
  ).select("-password")

  return res.status(200).json(new ApiResponse(200,user,"Avator upload Successfully "))
})

const updateUserCoverImage=asyncHandler(async (req,res)=>{

  const coverImageLocalPath=req.file?.path;
  if(!coverImageLocalPath){
    throw new ApiError(400,"coverImage file required ! ")
  }
  const coverImage=await uploadOnCloudinary(coverImageLocalPath);

  if(!coverImage.url){
    throw new ApiError(400,"Error required for uploading on coverImage ! ")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{coverImage:coverImage.url}
    },
    {
      new:true,
    }
  ).select("-password")

  return res.status(200).json(new ApiResponse(200,user,"Cover image upload Successfully "))
})

const getUserCahnnelprofile =asyncHandler(async(req,res)=>{
  const user=req.params;
  if(!user?.trim()){
    throw new ApiError(400,"Channel not exists ! ")
  }

 const channel = await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelSubscribedToCount:{
          $size:"$subscribedTo",
        },
        isSubscribed:{
          $cond:{
            if:{$in :[req.user?._id,"$subsribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullname:1,
        username:1,
        subscribersCount:1,
        channelSubscribedToCount:1,
        isSubscribed:1,
        avator:1,
        coverImage:1,
        email:1,

      }
    }
  ])
  if(!channel){
    throw new ApiError(400,"channel not Exist ! ");
  }
  return res.status(200)
            .json(new ApiResponse(200,channel[0],"User Profile fetched Successfuly !"))

})

const getWatchHistory =asyncHandler(async(req,res)=>{
  const user =await User.aggregate([
    {$match:{
      _id:new mongoose.Types.ObjectId(req.user._id)
    }},
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"owner",
        pipeline:[
          {
            $project:{
              fullname:1,
              username:1,
              avator:1
            }
          }
        ]
      }
    },
    {
      $addFields:{
        owner:{
          $first:"$owner",
        }
      }
    }
  ])

  return res.
  status(200)
  .json(
    new ApiResponse(
      200,user[0].watchHistory,
      "Watch History fetched successfully !",
    )
  )
})

export {registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvator,
  updateUserCoverImage,
  getUserCahnnelprofile,
  getWatchHistory

};