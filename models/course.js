import { Schema, model } from "mongoose";

const courseSchema = new Schema({
    title: { type: String, required: true },
    bannerImage: {
        data: Buffer,
        contentType: String,
    },
    tags: { type: [String] },
    description: { type: String, required: true },
    fee: { type: Number },
    duration: { type: String },
    content: [{ type: Schema.Types.ObjectId, ref: "Content" }],
    startDate: { type: Date, required: false },
    endDate: { type: Date, required: false },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

const CourseModel = model("Course", courseSchema);

export default CourseModel;