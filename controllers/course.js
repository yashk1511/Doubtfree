import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import CourseModel from "../models/course.js";
import ContentModel from "../models/content.js";
import fs from "fs";
import path from "path";
import UserModel from "../models/auth.js";
const BASE_URL = process.env.BASE_URL;
export const getCoursesByTags = async (req, res) => {
  const { tags } = req.query;

  try {
    const courses = await CourseModel.find({ tags: { $in: tags } });
    res.status(200).json(courses);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
export const getAllCourses = async (req, res) => {
  try {
    const courses = await CourseModel.find();
    let updatatedCourses = [];
    if (courses.length > 0) {
      courses.map((course) => {
        const bannerImageUrl = `BASE_URL/uploads/${course.title}_course`;
        updatatedCourses.push({
          course: course,
          bannerImageUrl: bannerImageUrl,
        });
      });
    }
    res.status(200).json(updatatedCourses);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const addcourse = async (req, res) => {
  const { title, fee, duration, tags, description, startDate, endDate, _id } =
    req.body; // Assuming you pass the userId in the request body

  try {
    const user = await UserModel.findById(_id); // Find the user by their ID
    console.log({
      title,
      fee,
      duration,
      tags,
      description,
      startDate,
      endDate,
      _id,
    });
    if (!user) {
      return res.status(200).json({ error: "User not found" });
    }
    const course = await CourseModel.create({
      title,
      tags,
      description,
      fee,
      duration,
      startDate,
      endDate,
      user: user._id, // Set the user for the course
    });
    let bannerImageUrl = "";
    if (req.file) {
      const newFileName = `${course.title}_course`;
      const oldFilePath = req.file.path;
      const newFilePath = path.join(path.dirname(oldFilePath), newFileName);
      fs.renameSync(oldFilePath, newFilePath);
      req.file.filename = newFileName;
      req.file.path = newFilePath;
      bannerImageUrl = `BASE_URL/uploads/${newFileName}`;
    }

    await course.save();

    // Update the user's Courses array with the new course ID
    user.Courses.push(course._id);
    await user.save();

    res.status(200).json({
      success: true,
      data: course,
      bannerImageUrl: bannerImageUrl,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};

export const addcontent = async (req, res) => {
  const { title, date_of_upload, uploader, description, type } = req.query;
  const { course_id } = req.params;
  try {
    const content = await ContentModel.create({
      title,
      date_of_upload,
      uploader,
      description,
      type,
    });

    if (req.file) {
      const newFileName = `${content._id}_pdf_file`;
      const oldFilePath = req.file.path;
      const newFilePath = path.join(path.dirname(oldFilePath), newFileName);
      fs.renameSync(oldFilePath, newFilePath);
      req.file.filename = newFileName;
      req.file.path = newFilePath;
      const pdfUrl = `BASE_URL/uploads/${newFileName}`;
      content.pdfFiles = pdfUrl;
    }

    await content.save();

    const course = await CourseModel.findById(course_id);
    course.content.push(content._id);
    await course.save();

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
};
export const Search = async (req, res) => {
  const result = await CourseModel.find({
    $or: [
      {
        tags: { $regex: req.params.key },
      },
      {
        title: { $regex: req.params.key },
      },
    ],
  });
  res.send(result);
};
