const nodemailer = require('nodemailer');

// Create transporter for sending emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Send welcome email
const sendWelcomeEmail = async (email, username) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Welcome to Task Manager!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a90e2;">Welcome to Task Manager, ${username}!</h2>
          <p>Thank you for registering with us. You can now start managing your tasks efficiently.</p>
          <p>Get started by:</p>
          <ul>
            <li>Creating your first task</li>
            <li>Setting due dates for important tasks</li>
            <li>Marking tasks as completed</li>
          </ul>
          <p>If you have any questions, feel free to reach out to our support team.</p>
          <p>Best regards,<br>Task Manager Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error.message);
  }
};

// Send task reminder email
const sendTaskReminderEmail = async (email, taskTitle, dueDate) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: `Task Reminder: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #e74c3c;">Task Reminder</h2>
          <p>This is a reminder that your task "<strong>${taskTitle}</strong>" is due on:</p>
          <p style="font-size: 18px; color: #e74c3c;"><strong>${new Date(dueDate).toLocaleDateString()}</strong></p>
          <p>Don't forget to complete it on time!</p>
          <p>Best regards,<br>Task Manager Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Task reminder email sent to ${email}`);
  } catch (error) {
    console.error('Error sending task reminder email:', error.message);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendTaskReminderEmail,
};