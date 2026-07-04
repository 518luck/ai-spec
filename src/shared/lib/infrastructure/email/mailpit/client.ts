import nodemailer from "nodemailer";

// Mailpit SMTP transport：本地开发用，邮件被 Mailpit 捕获不会真发出
export const mailpitTransport = nodemailer.createTransport({
	host: process.env.SMTP_HOST || "localhost",
	port: Number(process.env.SMTP_PORT) || 1025,
	secure: false,
	ignoreTLS: true,
});
