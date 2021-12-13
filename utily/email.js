const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
	// create reusable transporter object
	let transporter = nodemailer.createTransport({
		// اگر از جیمیل استفاده میکنید باید در تنظیمات اکانت جیمیلتان less secure app  را فعال کنید
		// service: 'Gmail',

		// در صورت استفاده از برنامه هایی مثل mailtrap باید host و posrt هم مشخص شوند
		host: process.env.EMAIL_HOST,
		port: process.env.EMAIL_PORT,

		auth: {
			user: process.env.EMAIL_USERNAME, // generated ethereal user
			pass: process.env.EMAIL_PASSWORD // generated ethereal password
		}
	});

	//Define the email option
	const mailOptions = {
		from: 'Auth Project <auth@gmail.com>',
		to: options.email,
		subject: options.subject,
		html: options.html
	};

	await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
