import { Schema, model } from "mongoose";

const userSchema = new Schema({
  name: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  residence: { type: String, required: false },
  mobile_number: { type: String },
  introduction: { type: String },
  gender: { type: String, required: true },
  date_of_birth: { type: String, required: true },
  isTeacher: { type: Boolean, required: true },
  Courses: { type: [String] },
  resetToken: { type: String },
  expireToken: { type: Date },
  profileImage: {
    data: Buffer,
    contentType: String,
  },
});

const UserModel = model("User", userSchema);

export default UserModel;
