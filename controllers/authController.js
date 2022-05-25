const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

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

module.exports.signUpGet = (req, res) => {
  res.render("signup");
};

module.exports.signUpPost = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.create({ email, password });
    const token = createToken(user._id);
    res.cookie("jwt", token, { httpOnly: true, maxAge: maxAgeSecs * 1000 });

    res.status(201).json({ user: user._id });
  } catch (e) {
    const errors = handleErrors(e);
    res.status(400).json({ errors });
  }
};

module.exports.loginGet = (req, res) => {
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
