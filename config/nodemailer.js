import nodemailer from "nodemailer";
export const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "newamish2001@gmail.com",
        pass: "vfiscmspgyynnold",
    },
});