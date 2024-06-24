import mongoose from "mongoose";
import bcrypt from "bcrypt";
 
const principalSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  fullName: { type: String, required: true },
  dob: { type: Date },
  phoneNo: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Making password required
  image: { type: String }, // Correcting typo from 'imag' to 'image'
  gender: { type: String },
  address: { type: String },
  city: { type: String },
  zipcode: { type: String },
  country: { type: String, default: 'India' },
  isDeleted: { type: Boolean, default: false },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },
});
 



export default mongoose.model("Principal", principalSchema);