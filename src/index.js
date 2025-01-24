// require('dotenv').config({path:'./env'})
import connectDB from "./db/index.js";
import express from "express"
const app=express();
import dotenv from "dotenv"
dotenv.config({
    path:'./env'
})

connectDB();

// connecting database 

/*
// (()=>)()  ==> this format is caller ifi , used for immediate execution
(async ()=>{
    try {
       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

       app.on("error",(error)=>{
        console.log("Error : ",error);
        throw(error);
       })

       app.listen(process.env.PORT,()=>{
        console.log(`app is listening on port ${process.env.PORT}`);
        
       })
    } catch (error) {
        console.log("Error : ",error);
        throw error;
    }
})()

*/