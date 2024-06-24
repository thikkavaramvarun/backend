import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const TeacherSchema = new mongoose.Schema({
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

// Pre-save hook to validate principalId if it's provided
TeacherSchema.pre('save', function (next) {
  if (this.principalId && !mongoose.Types.ObjectId.isValid(this.principalId)) {
    return next(new Error('Invalid principalId'));
  }
  next();
});


// TeacherSchema.pre('save', async function(next) {
//   if (this.isModified('password')) {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//   }
//   next();
// });

// TeacherSchema.methods.compare = async function(plainPassword) {
//   return bcrypt.compare(plainPassword, this.password);
// };


// //--------------updatePassword-----------//



// //-----------------Login----------///

// // pre-save hook for login
// TeacherSchema.pre("save", async function (next) {
//   try {
//       this.password = await bcrypt.hash(this.password, 10);
//       next();
//   } catch (err) {
//       next(err);
//   }
// });

// // Method to compare passwords
// TeacherSchema.methods.comparePassword = async function (plainPassword) {
//   return await bcrypt.compare(plainPassword, this.password);
// };



export default mongoose.model("Teacher", TeacherSchema);
