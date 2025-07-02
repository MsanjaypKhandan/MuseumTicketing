import User from "../../models/User.js";
import nodemailer from "nodemailer";
import qrcode from "qrcode";
import path from "path";
import os from "os";

const createTransporter = () =>
  nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_APP_PASSWORD,
    },
  });

export const sendemail = async (req, res, next) => {
  const { date, user, count, bookingId, museum, price } = req.body;

  if (!date || !user || !count || !bookingId || !museum) {
    return res.status(422).json({ message: "Missing required fields" });
  }

  let existingUser;
  try {
    existingUser = await User.findById(user);
  } catch (err) {
    return next(err);
  }

  if (!existingUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const qrCodeData = `Museum: ${museum}\nTickets: ${count}\nDate: ${date}\nBookingId: ${bookingId}`;
  const qrCodeImagePath = path.join(os.tmpdir(), `qrcode-${bookingId}.png`);

  try {
    await qrcode.toFile(qrCodeImagePath, qrCodeData);
  } catch (err) {
    return next(err);
  }

  const totalAmount = price ? count * price : "N/A";
  const textTemplate = `
HistoriScan Ticket Booking Confirmation

Dear ${existingUser.name},

Your ticket booking has been confirmed. Below are the booking details:

Museum: ${museum}
Date: ${date}
Tickets: ${count}
Total Amount: ₹${totalAmount}
Booking ID: ${bookingId}

Thank you for using HistoriScan. Enjoy your visit!

This is an automated email. Please do not reply.
  `.trim();

  const mailOptions = {
    from: `"HistoriScan" <${process.env.SMTP_EMAIL}>`,
    to: existingUser.email,
    subject: "Museum Ticket Booking Confirmation",
    text: textTemplate,
    attachments: [
      {
        filename: "ticket-qrcode.png",
        path: qrCodeImagePath,
        cid: `qrcode-${bookingId}@historiscan`,
      },
    ],
  };

  try {
    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("[Email] Failed to send:", err.message);
    return res.status(500).json({ message: "Failed to send confirmation email" });
  }
};
