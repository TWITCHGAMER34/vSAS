const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const axios = require('axios');

require('dotenv').config();
const app = express();

const upload = multer();
app.use(express.static('public'));
app.set('view engine', 'ejs');

const {
    MAIL_HOST,
    MAIL_PASS,
    MAIL_PORT,
    MAIL_USER,
    MAIL_TO
} = process.env;

let transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: false,
    auth: {
        user: MAIL_USER,
        pass: MAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

app.get("/", (req, res) => {
    res.render("index")
})

app.get("/about", (req, res) => {
    res.render("about")
})

app.get("/contact", (req, res) => {
    res.render("contact")
})

app.post('/send-email', upload.none(), (req, res) => {
    const mailOptions = {
        from: MAIL_USER,
        to: MAIL_TO,
        subject: 'Contact Form Submission',
        text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nMessage: ${req.body.message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) return console.log(error);
        console.log('Message sent: %s', info.messageId);

        // Send confirmation email to the user
        const confirmationMailOptions = {
            from: MAIL_USER,
            to: req.body.email, // User's email address
            subject: 'Your message has been sent',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4CAF50;">Thank you for contacting us!</h2>
            <p>Your message has been sent successfully. We will get back to you shortly.</p>
            <hr>
            <h3>Your Message:</h3>
            <p>${req.body.message}</p>
            <hr>
            <p>Best regards,</p>
            <p>SAS Virtual</p>
            <img src="cid:logo" alt="">
        </div>
    `,
            attachments: [{
                filename: 'SASVirtual-mail.png',
                path: __dirname + '/public/img/SASVirtual-mail.png', // Ensure this path is correct
                cid: 'logo' // Same cid value as in the html img src
            }]
        };

        transporter.sendMail(confirmationMailOptions, (error, info) => {
            if (error) return console.log(error);
            console.log('Confirmation message sent: %s', info.messageId);
        });
    });

    res.redirect('/contact');
});

app.listen(3000, () => console.log('Server started... http://localhost:3000'));