const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');

require('dotenv').config();
const app = express();

const upload = multer();
app.use(express.static('public'));
app.set('view engine', 'ejs');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
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
    let mailOptions = {
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        subject: 'Contact Form Submission',
        text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nMessage: ${req.body.message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });

    res.redirect('/contact');
});

app.listen(3000, () => console.log('Server started... http://localhost:3000'));