const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "zoho",
  auth: {
    user: "jhess.test@zohomail.com",
    pass: process.env.EMAIL_PASS,
  },
});

const handleErrors = (err) => {
  const errors = { email: "", password: "" };
  if (err.message.includes("user validation failed")) {
    errors.email = err.errors.email && err.errors.email.message;
    errors.password = err.errors.password && err.errors.password.message;
    return errors;
  }
  if (err.code === 11000) {
    errors.email = "Email already registered";
  }
  if (err.message.toLowerCase().includes("email")) {
    errors.email = err.message;
  }
  if (err.message.toLowerCase().includes("password")) {
    errors.password = err.message;
  }
  return errors;
};

const maxAgeSecs = 3 * 24 * 60 * 60;

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: maxAgeSecs });
};

module.exports.signUpPage = (req, res) => {
  res.render("signup");
};

module.exports.signUpPost = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.create({ email, password, confirmed: false });
    const token = createToken(user._id);

    const url = `http://localhost:3000/email-confirmation?token=${token}`;

    const mailOptions = {
      from: "jhess.test@zohomail.com",
      to: email,
      subject: "Confirm your account",
      text: `Please click <a=${url}>here</a=$> to confirm your account in Ninja smoothies.`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res.status(400).json({ error });
      }
      console.log("Email sent");
      res.status(201).json({});
    });
  } catch (e) {
    console.log(e);
    const errors = handleErrors(e);
    res.status(400).json({ errors });
  }
};

module.exports.loginPage = (req, res) => {
  res.render("login");
};

module.exports.loginPost = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAgeSecs * 1000 });

    res.status(201).json({ user: user._id });
  } catch (e) {
    const errors = handleErrors(e);
    res.status(400).json({ errors });
  }
};

module.exports.logout = (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, maxAge: 1 });
  res.redirect("/");
};

module.exports.emailConfirmationPage = (req, res) => {
  res.render("email-confirmation");
};

module.exports.confirmEmailPage = (req, res) => {
  res.render("confirm-email");
};

module.exports.emailConfirmationPost = async (req, res) => {
  const { token } = req.body;
  console.log(token);

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      res.locals.user = null;
      res.status(400).json({ errors });
    }

    let user = await User.findByIdAndUpdate(
      { _id: decodedToken.id },
      { confirmed: true }
    );
    if (!user) res.status(400).json({ errors });

    const newToken = createToken(user._id);
    res.cookie("jwt", newToken, { httpOnly: true, maxAge: maxAgeSecs * 1000 });
    res.locals.user = user;
    res.status(201).json({ user: user._id });
  });
};
