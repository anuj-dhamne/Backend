// require('dotenv').config({path:'./env'})
import connectDB from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv"
dotenv.config({
    path:'./env'
})

connectDB()
.then(
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server connect on ${process.env.PORT}`);
        
    })
).catch((error)=>{
    console.log("MnogoDB connection Failed : ",error);
})

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