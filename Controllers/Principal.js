
import Principal from '../Model/PrincipalSchema.js';
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer'
const salt = bcrypt.genSaltSync(10);
const fixedSalt = '$2b$10$Vj1Ch.zy5LHvKtKNdq1.Ku'


export const PrincipalCreate = async (req, res) => {
  const query = {
    $or: [{ email: req.body.email }, { phoneNo: req.body.phoneNo}],
    isDeleted: false
  };

  try {
    const users = await Principal.find(query);
    let emailExists = false;
    let phoneNoExists = false;

    users.forEach(user => {
      if (user.email === req.body.email) {
        emailExists = true;
      }
      if (user.phoneNo === req.body.phoneNo) {
        phoneNoExists = true;
      }
    });

    if (emailExists || phoneNoExists) {
      let errors = [];
      if (emailExists) {
        errors.push("Email already exists.");
      }
      if (phoneNoExists) {
        errors.push("Phone number already exists.");
      }
      return res.status(400).send({
        Status: "Failed",
        messages: errors
      });
    } else {
      const otp = generateOTP();
      // otpStore[email] = otp;
      // console.log(`Generated OTP: ${otp} for email: ${email}`);

      await sendOTP(otp, req.body.email);
      const newObj = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        fullName: `${req.body.firstName} ${req.body.lastName}`,
        phoneNo: req.body.phoneNo,
        email: req.body.email,
        otp:otp
      };

      const result = new Principal(newObj);
      await result.save();
      return res.send({ status: "200", message: "Principal created successfully." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: "500", message: "Internal Server Error" });
  }
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
   
  const sendOTP = async (otp, email) => {
    try {
      const transport = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'arshadshaik0430@gmail.com',
          pass: 'ijtagrcqvgswsssa'
        },
      });
   
      const mailOptions = {
        from: 'Support<arshadshaik0430@gmail.com>',
        to: email,
        subject: 'Your OTP for Password Reset',
        text: `Please use this OTP to reset your password: ${otp}`,
      };
   
      console.log(mailOptions);
   
      const info = await transport.sendMail(mailOptions);
      console.log("Email sent: " + info.response);
   
      return { status: "200", message: "Email sent successfully" };
    } catch (err) {
      console.error(err);
      return { status: "500", message: "Failed to send email", error: err };
    }
  };


  // export const PrincipalEmailSendOtp = async function (req, res) {
  //   if (req.body.email && req.body.email !== "") {
  //       const email = req.body.email.trim();
  //       const query = { email: email, isDeleted: false };
  
  //       try {
  //           const principal = await Principal.findOne(query);
  //           if (!principal) {
  //               return res.status(404).send({ Status: "Failed", message: "Invalid User" });
  //           }
  
  //           const otp = generateOTP();
  //           const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
  //           principal.otp = otp;
  //           principal.otpExpiry = otpExpiry;
  //           await principal.save();
  
  //           const emailResponse = await sendOTP(otp, email);
  //           if (emailResponse.status === "500") {
  //               return res.status(500).send({ Status: "Failed", message: "Failed to send OTP email" });
  //           }
  
  //           res.send({ Status: "Success", message: "OTP sent to your email for password reset." });
  
  //       } catch (error) {
  //           console.error(error);
  //           res.status(500).send({ Status: "Failed", message: "Internal Server Error" });
  //       }
  //   } else {
  //       res.status(400).send({ Status: "Failed", message: "Invalid request" });
  //   }
  // };
  const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
 
  
  export const PrincipalEmailSendOtp = async function (req, res) {
      if (req.body.email && req.body.email !== "") {
          const email = req.body.email.trim();
          const query = { email: email, isDeleted: false };
    
          try {
              const principal = await Principal.findOne(query);
              if (!principal) {
                  return res.status(404).send({ Status: "Failed", message: "Invalid User" });
              }
    
              const otp = generateOTP();
              const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
              principal.otp = otp;
              principal.otpExpiry = otpExpiry;
              await principal.save();
    
              const emailResponse = await sendOTP(otp, email);
              if (emailResponse.status === "500") {
                  return res.status(500).send({ Status: "Failed", message: "Failed to send OTP email" });
              }
    
              res.send({
                  Status: "Success",
                  message: "OTP sent to your email for password reset.",
                  email: email
              });
    
          } catch (error) {
              console.error(error);
              res.status(500).send({ Status: "Failed", message: "Internal Server Error" });
          }
      } else {
          res.status(400).send({ Status: "Failed", message: "Invalid request" });
      }
  };
  
  
  export const PrincipalVerifyOTP = async function (req, res) {
    const { email, otp } = req.body;
  
    if (!email || !otp) {
      return res.status(400).send({ Status: "Failed", message: "Email and OTP are required." });
    }
  
    try {
      const principal = await Principal.findOne({ email: email.trim(), isDeleted: false });
  
      if (!principal) {
        return res.status(404).send({ Status: "Failed", message: "Invalid User" });
      }
  
      console.log("Stored OTP:", principal.otp);
      console.log("Provided OTP:", otp);
  
      // Check if provided OTP matches the stored OTP
      if (principal.otp !== otp) {
        return res.status(400).send({ Status: "Failed", message: "Invalid OTP" });
      }
  
      // Check if the OTP has expired (valid for 5 minutes)
      const otpExpiryTime = new Date(principal.otpExpiry);
      const currentTime = new Date();
  
      if (currentTime > otpExpiryTime) {
        return res.status(400).send({ Status: "Failed", message: "OTP has expired" });
      }
  
      // OTP is valid and not expired, clear the OTP fields from the principal document
      principal.otp = null;
      principal.otpExpiry = null;
      await principal.save();
  
      return res.status(200).send({ Status: "Success", message: "OTP verified successfully" });
  
    } catch (error) {
      console.error("Error in PrincipalVerifyOTP:", error);
      return res.status(500).send({ Status: "Failed", message: "Internal Server Error" });
    }
  };
  


  export const PrincipalResendOtp = async (req, res) => {
      try {
        const {  email } = req.body;
     
        if ( !email) {
          return res.status(400).send({ Status: "Failed", message: "User ID and email are required" });
        }
     
        const query = {  email: email.trim(), isDeleted: false };
     
        const principal = await Principal.findOne(query);
     
        if (!principal) {
          return res.status(404).send({ Status: "Failed", message: "Invalid User" });
        }
     
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
     
        principal.otp = otp;
        principal.otpExpiry = otpExpiry;
     
        await principal.save();
     
        const emailResponse = await sendOTP(otp, email);
        if (emailResponse.status === "500") {
          return res.status(500).send({ Status: "Failed", message: "Failed to send OTP email" });
        }
     
        res.send({ Status: "Success", message: "OTP resent to your email for password reset." });
     
      } catch (error) {
        console.error("Error during OTP resending:", error);
        res.status(500).send({ Status: "Failed", message: "Internal Server Error" });
      }
    };


    export const principalSetPassword = async (req, res) => {
      try {
        const { email, password, confirmPassword } = req.body;
     
        // Check if password and confirm password match
        if (password !== confirmPassword) {
          return res.status(400).json({
            status: "Failed",
            message: "Password and confirm password do not match."
          });
        }
     
        // Find the principal by email
        const principal = await Principal.findOne({ email });
        if (!principal) {
          return res.status(404).json({
            status: "Failed",
            message: "Principal not found."
          });
        }
     
        // Hash the new password
        const saltRounds = 10; // Adjust the number of salt rounds as needed
        const hashedPassword = await bcrypt.hash(password, saltRounds);
     
        // Set the hashed password
        principal.password = hashedPassword;
        await principal.save();
     
        return res.status(200).json({
          status: "Success",
          message: "Password set successfully."
        });
      } catch (error) {
        console.error("Error in principalSetPassword:", error);
        return res.status(500).json({
          status: "Error",
          message: "Internal Server Error"
        });
      }
    }



  

export const PrincipalLogin = async function (req, res) {
  const { email, password } = req.body;

  if (email && email.trim() !== "" && password && password.trim() !== "") {
    try {
      console.log("Attempting to find user with email:", email.trim());
      const user = await Principal.findOne({
        email: email.trim(),
        isDeleted: false,
      });

      if (!user) {
        console.log("User not found for email:", email.trim());
        return res.status(401).send({
          Status: "Failed",
          msg: "The email address or password you entered is not valid. Please try again.",
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      console.log(isMatch, "isMatch");

      if (!isMatch) {
        console.log("Password mismatch for email:", email.trim());
        return res.status(401).send({
          Status: "Failed",
          msg: "The email address or password you entered is not valid. Please try again.",
        });
      }

      console.log("Login successful for user:", user.fullName);
      res.status(200).send({
        Status: "Success",
        msg: "Login successful",
        id: user._id,
        fullName: user.fullName,
        phoneNo: user.phoneNo,
        email: user.email,
      });
    } catch (err) {
      console.error("Error during login process:", err);
      res.status(500).send({
        Status: "Failed",
        msg: "Internal Server Error",
      });
    }
  } else {
    console.log("Email or password not provided");
    res.status(400).send({
      Status: "Failed",
      msg: "Please provide email and password.",
    });
  }
};

export const PrincipalChangePassword = async (req, res) => {
  const query = {
    email: req.body.email,
    isDeleted: false
  };
 
  try {
    // Fetch the principal record
    const principal = await Principal.findOne(query);
 
    if (!principal) {
      res.send({
        Status: "Failed",
        msg: "Teacher not found or is inactive."
      });
      return;
    }
 
    // Check if the new password is the same as the existing password
    const isSamePassword = await bcrypt.compare(req.body.newPassword, principal.password);
    if (isSamePassword) {
      res.send({
        Status: "Failed",
        msg: "The new password cannot be the same as the current password."
      });
      return;
    }
 
    // Check if the new password matches the confirm password
    if (req.body.newPassword !== req.body.confirmPassword) {
      res.send({
        Status: "Failed",
        msg: "The new password and confirm password do not match."
      });
      return;
    }
 
    // Hash the new password
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
 
    // Proceed to update the password
    const setUpdate = {
      password: hashedPassword,
      updatedDate: Date.now()
    };
 
    const response = await Principal.findOneAndUpdate(query, { $set: setUpdate }, { new: true });
 
    res.send({
      Status: "Success",
      msg: "Password updated successfully",
      data: response
    });
 
  } catch (error) {
    console.error(error);
    res.status(500).send({
      Status: "Failed",
      msg: "Internal Server Error"
    });
  }
};










    
    


   

