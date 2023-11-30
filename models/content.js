import { Schema, model } from "mongoose";

const contentSchema = new Schema({
  title: { type: String, required: true },
  date_of_upload: { type: String },
  uploader: { type: String },
  description: { type: String },
  type: { type: String },
  pdfFiles: [
    {
      data: Buffer,
      contentType: String,
    },
  ],
});

const ContentModel = model("Content", contentSchema);

export default ContentModel;
