import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import UserModel from "../models/auth.js";
import fs from "fs";
import path from "path";
import { resetPasswordMailer } from "../mailers/password_reset_mailer.js";
const BASE_URL = process.env.BASE_URL;
export const signup = async (req, res) => {
  console.log(req.body);
  const {
    isTeacher,
    name,
    email,
    password,
    residence,
    mobile_number,
    introduction,
    gender,
    date_of_birth,
  } = req.body;
  if (
    !name ||
    !email ||
    !password ||
    !residence ||
    !mobile_number ||
    !introduction ||
    !gender ||
    !date_of_birth
  ) {
    return res.status(200).json({
      error: "Empty fields",
      message: {
        isTeacher: "This field is required",
        name: "This field is required",
        email: "This field is required",
        password: "This field is required",
        residence: "This field is required",
        mobile_number: "This field is required",
        introduction: "This field is required",
        gender: "This field is required",
        date_of_birth: "This field is required",
        profileImage: "This field is required",
      },
    });
  }
  try {
    const existinguser = await UserModel.findOne({ email });
    if (existinguser) {
      return res.status(200).json({ message: "User already Exist." });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    try {
      const newUser = await UserModel.create({
        isTeacher,
        name,
        email,
        password: hashedPassword,
        residence,
        mobile_number,
        introduction,
        gender,
        date_of_birth,
        profileImage: {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        },
      });

      const token = jwt.sign(
        { email: newUser.email, id: newUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );
      const newFileName = `${newUser.email.split("@")[0]}_profile_image`;
      const oldFilePath = req.file.path;
      const newFilePath = path.join(path.dirname(oldFilePath), newFileName);
      fs.renameSync(oldFilePath, newFilePath);
      req.file.filename = newFileName;
      req.file.path = newFilePath;
      const profileImageURL = `BASE_URL/uploads/${newFileName}`;
      res
        .status(200)
        .json({ result: newUser, profileImage: profileImageURL, token });
    } catch (error) {
      console.error("Error during user creation:", error);
      res.status(200).json({ message: "Error during user creation." });
    }
  } catch (error) {
    res.status(200).json({ message: "Something went worng..." });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email | !password) {
    return res.status(400).json({
      error: "Empty fields",
      message: {
        email: "This field is required",
        password: "This field is required",
      },
    });
  }
  try {
    const existinguser = await UserModel.findOne({ email });
    if (!existinguser) {
      return res.status(404).json({ message: "User don't Exist." });
    }

    const isPasswordCrt = await bcrypt.compare(password, existinguser.password);
    if (!isPasswordCrt) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { email: existinguser.email, id: existinguser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const profileImageURL = `BASE_URL/uploads/${
      email.split("@")[0]
    }_profile_image`;
    res
      .status(200)
      .json({ result: existinguser, profileImage: profileImageURL, token });
  } catch (error) {
    res.status(200).json({ message: "Something went worng..." });
  }
};

export const updateProfile = async (req, res) => {
  const { residence, mobile_number, introduction, gender, date_of_birth, _id } =
    req.body;
  const updatedFields = {
    residence,
    mobile_number,
    introduction,
    gender,
    date_of_birth,
  };

  // try {
  const currentUser = await UserModel.findById(_id);

  if (!currentUser) {
    return res.status(200).json({ message: "User not found" });
  }
  let profileImageURL = "";
  if (req.file) {
    if (currentUser.profileImage && currentUser.profileImage.fileName) {
      fs.unlinkSync(`../uploads/${currentUser.profileImage.fileName}`);
    }
    updatedFields.profileImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
      fileName: req.file.filename,
    };
    const newFileName = `${currentUser.email.split("@")[0]}_profile_image`;
    const oldFilePath = req.file.path;
    const newFilePath = path.join(path.dirname(oldFilePath), newFileName);
    fs.renameSync(oldFilePath, newFilePath);
    req.file.filename = newFileName;
    req.file.path = newFilePath;
    profileImageURL = `BASE_URL/uploads/${newFileName}`;
  }
  if (profileImageURL === "") {
    profileImageURL = `BASE_URL/uploads/${
      currentUser.email.split("@")[0]
    }_profile_image`;
  }
  const token = jwt.sign(
    { email: currentUser.email, id: currentUser._id },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
  const updatedProfile = await UserModel.findByIdAndUpdate(
    _id,
    { $set: updatedFields },
    { new: true }
  );

  res.status(200).json({
    result: updatedProfile,
    token: token,
    profileImage: profileImageURL,
  });
  // } catch (error) {
  //     res.status(500).json({ message: 'An error occurred while updating the profile' });
  // }
};

export const resetPassword = async (req, res) => {
  try {
    console.log(req.body.email);
    const token = Math.floor(1000 + Math.random() * 9000).toString();
    const user = await UserModel.findOne({ email: req.body.email });

    if (!user) {
      return res
        .status(200)
        .json({ error: "User doesn't exist with the given email" });
    }

    user.resetToken = token;
    user.expireToken = Date.now() + 3600000;
    user.markModified("resetToken");
    user.markModified("expireToken");
    await user.save();

    resetPasswordMailer(req.body.email, token);

    res.json({ message: "Check your email for the reset token" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong..." });
  }
};

export const newPassword = async (req, res) => {
  try {
    const newPassword = req.body.password;
    const sentToken = req.body.token;

    const user = await UserModel.findOne({
      resetToken: sentToken,
      expireToken: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(200)
        .json({ error: "Try again! Session may have expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.expireToken = undefined;

    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong..." });
  }
};
