import express from "express";
import {
    login,
    signup,
    updateProfile,
    resetPassword,
    newPassword,
} from "../controllers/auth.js";
import {
    getCoursesByTags,
    addcourse,
    addcontent,
    getAllCourses,
    Search,
} from "../controllers/course.js";
import multer from "multer";
import auth from "../middleware/auth.js";
const router = express.Router();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const filename = "profile_image_of_" + req.body.email;
        cb(null, filename);
    },
});

const upload = multer({ storage: storage });

router.post("/signup", upload.single("file"), signup);
router.post("/login", login);
router.post("/update", upload.single("file"), updateProfile);
router.get("/courses", getCoursesByTags);
router.get("/courses/all", getAllCourses);
router.post("/addcourse", upload.single("file"), addcourse);
router.post("/courses/:course_id", addcontent);
router.get("/search/:key", Search);
router.post("/resetPassword", resetPassword);
router.post("/new-password", newPassword);
export default router;