const nodemailer = require("nodemailer");

// Create a reusable transporter using Ethereal (Free testing SMTP)
// In a real production environment, you would use SendGrid, Mailgun, or standard SMTP credentials.
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'karlie.russel@ethereal.email', // generated ethereal user
        pass: 'Hk8KqFStjWkY5Vz9Z6'  // generated ethereal password
    }
});

/**
 * Send an email using Nodemailer
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 * @returns {Promise<any>} Info object from Nodemailer
 */
const sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: '"Serv.io Admin" <no-reply@serv.io>',
            to,
            subject,
            text,
            html
        });
        
        console.log("Message sent: %s", info.messageId);
        // Preview URL is extremely useful for testing without checking an actual inbox
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = { sendEmail };
