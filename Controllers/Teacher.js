import Teacher from '../Model/TeacherModel.js';
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer'
const salt = bcrypt.genSaltSync(10);
const fixedSalt = '$2b$10$Vj1Ch.zy5LHvKtKNdq1.Ku'


// /**
//  * 
//  *TeacherCreate
//  * @type POST
//  *
//  */

export const TeacherCreate = async (req, res) => {
  const query = {
    $or: [{ email: req.body.email }, { phoneNo: req.body.phoneNo}],
    isDeleted: false
  };

  try {
    const users = await Teacher.find(query);
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
        errors.push("PhoneNo number already exists.");
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

      const result = new Teacher(newObj);
      await result.save();
      return res.send({ status: "200", message: "Principal created successfully." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ status: "500", message: "Internal Server Error" });
  }
};



// /**
//  * 
//  *OTP generate
//  * @type POST
//  *
//  */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


// /**
//  * 
//  *TeacherSend Otp
//  * @type POST
//  *
//  */

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



const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

// /**
//  * 
//  *TeacherEmailSendOtp
//  * @type POST
//  *
//  */


export const TeacherEmailSendOtp = async function (req, res) {
  if (req.body.email && req.body.email !== "") {
      const email = req.body.email.trim();
      const query = { email: email, isDeleted: false };

      try {
          const teacher = await Teacher.findOne(query);
          if (!teacher) {
              return res.status(404).send({ Status: "Failed", message: "Invalid User" });
          }

          const otp = generateOTP();
          const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
          teacher.otp = otp;
          teacher.otpExpiry = otpExpiry;
          await teacher.save();

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

// /**
//  * 
//  *TeacherVerifyOtp
//  * @type POST
//  *
//  */

export const TeacherVerifyOTP = async function (req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).send({ Status: "Failed", message: "Email and OTP are required." });
  }

  try {
    const teacher = await Teacher.findOne({ email: email.trim(), isDeleted: false });

    if (!teacher) {
      return res.status(404).send({ Status: "Failed", message: "Invalid User" });
    }

    console.log("Stored OTP:", teacher.otp);
    console.log("Provided OTP:", otp);

    // Check if provided OTP matches the stored OTP
    if (teacher.otp !== otp) {
      return res.status(400).send({ Status: "Failed", message: "Invalid OTP" });
    }

    // Check if the OTP has expired (valid for 5 minutes)
    const otpExpiryTime = new Date(teacher.otpExpiry);
    const currentTime = new Date();

    if (currentTime > otpExpiryTime) {
      return res.status(400).send({ Status: "Failed", message: "OTP has expired" });
    }

    // OTP is valid and not expired, clear the OTP fields from the principal document
    teacher.otp = null;
    teacher.otpExpiry = null;
    await teacher.save();

    return res.status(200).send({ Status: "Success", message: "OTP verified successfully" });

  } catch (error) {
    console.error("Error in TeacherVerifyOTP:", error);
    return res.status(500).send({ Status: "Failed", message: "Internal Server Error" });
  }
};

// /**
//  * 
//  *TeacherSetPassword
//  * @type POST
//  *
//  */

export const TeacherSetPassword = async (req, res) => {
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
    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
      return res.status(404).json({
        status: "Failed",
        message: "Teacher not found."
      });
    }
 
    // Hash the new password
    const saltRounds = 10; // Adjust the number of salt rounds as needed
    const hashedPassword = await bcrypt.hash(password, saltRounds);
 
    // Set the hashed password
    teacher.password = hashedPassword;
    await teacher.save();
 
    return res.status(200).json({
      status: "Success",
      message: "Password set successfully."
    });
  } catch (error) {
    console.error("Error in teacherSetPassword:", error);
    return res.status(500).json({
      status: "Error",
      message: "Internal Server Error"
    });
  }
}


// /**
//  * 
//  *TeacherResendOtp
//  * @type POST
//  *
//  */
export const TeacherResendOtp = async (req, res) => {
  try {
    const { email } = req.body;
 
    if (!email) {
      return res.status(400).send({ Status: "Failed", message: "Email is required" });
    }
 
    const query = { email: email.trim(), isDeleted: false };
 
    const teacher = await Teacher.findOne(query);
 
    if (!teacher) {
      return res.status(404).send({ Status: "Failed", message: "Invalid User" });
    }
 
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes
 
    teacher.otp = otp;
    teacher.otpExpiry = otpExpiry;
 
    await teacher.save();
 
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
 


// /**
//  * 
//  *TeacherLogin
//  * @type POST
//  *
//  */
export const TeacherLogin = async (req, res) => {
  const { email, password } = req.body;
 
  if (email && email.trim() !== "" && password && password.trim() !== "") {
    try {
      console.log("Attempting to find user with email:", email.trim());
      const teacher = await Teacher.findOne({
        email: email.trim(),
        isDeleted: false,
      });
 
      if (!teacher) {
        console.log("Teacher not found for email:", email.trim());
        return res.status(401).send({
          Status: "Failed",
          msg: "The email address or password you entered is not valid. Please try again.",
        });
      }
 
      const isMatch = await bcrypt.compare(password, teacher.password);
      console.log(isMatch, "isMatch");
 
      if (!isMatch) {
        console.log("Password mismatch for email:", email.trim());
        return res.status(401).send({
          Status: "Failed",
          msg: "The email address or password you entered is not valid. Please try again.",
        });
      }
 
      console.log("Login successful for teacher:", teacher.fullName);
      res.status(200).send({
        Status: "Success",
        msg: "Login successful",
        id: teacher._id,
        fullName: teacher.fullName,
        email: teacher.email,
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



// /**
//  * 
//  *TeacherChangePassword
//  * @type POST
//  *
//  */
export const TeacherChangePassword = async (req, res) => {
  const query = {
    email: req.body.email,
    isDeleted: false
  };
 
  try {
    // Fetch the principal record
    const teacher = await Teacher.findOne(query);
 
    if (!teacher) {
      res.send({
        Status: "Failed",
        msg: "Teacher not found or is inactive."
      });
      return;
    }
 
    // Check if the new password is the same as the existing password
    const isSamePassword = await bcrypt.compare(req.body.newPassword, teacher.password);
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
 
    const response = await Teacher.findOneAndUpdate(query, { $set: setUpdate }, { new: true });
 
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



// /**
//  * 
//  *Teacher delete
//  * @type POST
//  *
//  */
// export const TeacherDelete = async (req, res) => {
//   const query = {
//       _id: req.body._id,
//   };

//   const updateObj = {
//       isDeleted: true,
//       updatedDate: Date.now()
//   };

//   try {
//       const response = await Teacher.findOneAndUpdate(query, { $set: updateObj }, { new: true });
//       if (response) {
//           res.send({
//               Status: "Success",
//               msg: "Teacher deleted successfully",
//               data: response
//           });
//       } else {
//           res.send({
//               Status: "Failed",
//               msg: "Teacher not found or is already deleted."
//           });
//       }
//   } catch (error) {
//       console.error(error);
//       res.status(500).send({
//           Status: "Failed",
//           msg: "Internal Server Error"
//       });
//   }
// };
 