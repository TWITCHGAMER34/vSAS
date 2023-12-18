const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');

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

app.get("/", (req,res) => {
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
    });

    res.redirect('/contact');
});

app.listen(3000, () => console.log('Server started... http://localhost:3000'));