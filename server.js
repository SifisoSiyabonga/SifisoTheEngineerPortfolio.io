const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Check environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error("EMAIL_USER or EMAIL_PASS is missing from the .env file.");
    process.exit(1);
}

console.log("EMAIL_USER:", process.env.EMAIL_USER);

// Configure Gmail transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    logger: true,
    debug: true
});

// Verify transporter
transporter.verify((error, success) => {
    if (error) {
        console.error("Transporter Error:", error);
    } else {
        console.log("Email server is ready.");
    }
});

// Contact Form Route
app.post('/send-email', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required.'
            });
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            replyTo: email,
            subject: `Portfolio Contact Form - ${name}`,
            text: `
You have received a new message from your portfolio.

Name: ${name}
Email: ${email}

Message:
${message}
            `,
            html: `
                <h2>New Portfolio Contact</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        console.log("Email sent:", info.response);

        res.status(200).json({
            success: true,
            message: 'Message sent successfully.'
        });

    } catch (error) {
        console.error("Email Error:", error);

        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});