import mongoose from "mongoose";
import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv"
// import Router from "./Routes/UserRoutes";
import router from "./Routes/UserRoutes.js";


const app = express();

app.use(bodyParser.json());
dotenv.config();
const PORT = process.env.PORT|| 5000;
const MONGOURL = process.env.MONGO_URL;

mongoose.connect(MONGOURL).then(()=>{
   
        console.log("Database connected successful.");
        app.listen(PORT,()=>{
        console.log(`sever is running on port ${PORT}`);
        })

}).catch((error)=>console.log(error));

app.use("/",router)
