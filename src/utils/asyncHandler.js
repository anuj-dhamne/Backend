
// for handling async function we can use 2 methods , 1)using try-catch 2)using promises

// Using Promises: 

const asyncHandler=(requestHandler)=>{
   return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>{
            console.log("Caught error in AsyncHandler : ",err)
            next(err)});
    }
}

export {asyncHandler};

// Using try catch

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }
