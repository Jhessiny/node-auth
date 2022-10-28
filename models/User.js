const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Please, enter an email"],
    unique: true,
    lowercase: true,
    validate: [isEmail, "Email is not valid"],
  },
  password: {
    type: String,
    required: [true, "Please, enter a password"],
    minlength: [6, "Password should be at least 6 characters long"],
  },
  confirmed: {
    type: Boolean,
    required: true,
  },
});

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) throw Error("Email not found");
  if (!user.confirmed) throw Error("Please confirm your email to login");

  const isAuthenticated = await bcrypt.compare(password, user.password);
  if (isAuthenticated) return user;

  throw Error("Incorrect password");
};

const User = mongoose.model("user", userSchema);

module.exports = User;
