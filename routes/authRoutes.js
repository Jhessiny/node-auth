const { Router } = require("express");
const authController = require("../controllers/authController");

const router = Router();

router.post("/signup", authController.signUpPost);
router.post("/login", authController.loginPost);
router.post("/email-confirmation", authController.emailConfirmationPost);
router.get("/logout", authController.logout);

//pages
router.get("/signup", authController.signUpPage);
router.get("/login", authController.loginPage);
router.get("/email-confirmation", authController.emailConfirmationPage);
router.get("/confirm-email", authController.confirmEmailPage);

module.exports = router;
