import express from 'express';
// import { PrincipalChangePassword, PrincipalCreate, PrincipalGetDetails, PrincipalLogin, PrincipalResendOtp, PrincipalSetPassword, PrincipalVerifyOTP, principalForgetPassword } from '../Controllers/Principal.js';
// import { TeacherChangePassword, TeacherCreate, TeacherDelete, TeacherForgetPassword, TeacherGetDetails, TeacherLogin, TeacherResendOtp, TeacherSetPassword, TeacherUpdate, TeacherVerifyOTP } from '../Controllers/Teacher.js';
import { PrincipalChangePassword, PrincipalCreate, PrincipalEmailSendOtp, PrincipalLogin, PrincipalResendOtp, PrincipalVerifyOTP, principalSetPassword } from '../Controllers/Principal.js';
import { TeacherChangePassword, TeacherCreate, TeacherEmailSendOtp, TeacherLogin, TeacherResendOtp, TeacherSetPassword, TeacherVerifyOTP } from '../Controllers/Teacher.js';

 
const router = express.Router();
 
//---POST---//
router.post('/principal/create', PrincipalCreate);

router.post('/principal/setPassword', principalSetPassword);


 router.put('/principal/changePassword', PrincipalChangePassword);


router.post('/principal/login', PrincipalLogin);

// router.get("/principal/information/:_id", PrincipalGetDetails);

 router.post("/Principal/sendOtp",PrincipalEmailSendOtp);



router.post('/Principal/verifyotp', PrincipalVerifyOTP);

router.post("/Principal/resendOtp",PrincipalResendOtp)








//---POST---//








//post for Teacher//
 router.post('/teacher/create',TeacherCreate);



// router.delete('/Teacher/delete',TeacherDelete)


// router.get("/getTeacher/:_id",TeacherGetDetails)


// router.put("/TeacherUpdated/",TeacherUpdate)

router.put('/Teacher/changePassword',TeacherChangePassword);



 router.post('/Teacher/verifyotp', TeacherVerifyOTP);



 router.post('/Teacher/login',TeacherLogin)


 router.post('/Teacher/emailSendOtp',TeacherEmailSendOtp);

router.post('/Teacher/setPassword',TeacherSetPassword);

router.post("/Teacher/resendOtp",TeacherResendOtp)







export default router;