const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.name = user.name;
    this.url = url;
    this.from = process.env.EMAIL_FROM;
  }

  newTransport() {
    // if (process.env.NODE_ENV.trim() === 'production') {
    //   // sendgrid
    //   return nodemailer.createTransport({
    //     service: process.env.EMAIL_SENDGRID_SERVICE,
    //     auth: {
    //       user: process.env.EMAIL_SENDGRID_USERNAME,
    //       pass: process.env.EMAIL_SENDGRID_PASSWORD,
    //     },
    //   });
    // }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // Render
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.name,
        url: this.url,
        subject,
      }
    );

    // Define
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };

    // transport
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'your password reset link (only valid for 10 min)'
    );
  }
};

// const sendEmail = async (options) => {
//   // 1) create a transporter
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: process.env.EMAIL_PORT,
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });
//   // 2) define the email
//   const mailOptions = {
//     from: process.env.EMAIL_FROM,
//     to: options.email,
//     subject: options.subject,
//     text: options.message,
//     // html:
//   };

//   // 3) actually send the email
//   await transporter.sendMail(mailOptions);
// };

// module.exports = sendEmail;
