const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const expressSession = require("express-session");
const FileStore = require("session-file-store")(expressSession);
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const sharp = require("sharp");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();
const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(
  expressSession({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store: new FileStore({}),
    cookie: { maxAge: 3600000 },
  }),
);
app.use(bodyParser.json());
app.set("view engine", "ejs");

const filter = (req, file, cb) => {
  if (file.mimetype.split("/")[0] === "image") {
    cb(null, true);
  } else {
    cb(new Error("Only images are allowed!"));
  }
};

const storage = multer.memoryStorage();

const upload = multer({ storage: storage, fileFilter: filter });

const db = require("knex")({
  client: "sqlite3",
  connection: "./dev.sqlite3",
});

function generateHashFilename(filename) {
  const hash = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const end = filename.split(".").pop();
  return `${hash}.${end}`;
}

const { MAIL_HOST, MAIL_PASS, MAIL_PORT, MAIL_USER, MAIL_TO } = process.env;

let transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: false,
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.status(200).send();
});

app.get("/posts", async (req, res) => {
  const posts =
    await db.raw(`SELECT id, user_id, title, content, image_url, created_at, comments
                      FROM posts
                               LEFT JOIN (SELECT post_id,
                                                 group_concat(json_object(
                                                         'id', comments.id,
                                                         'post_id', post_id,
                                                         'user_id', user_id,
                                                         'user',
                                                         json_object('id', users.id, 'username', users.username),
                                                         'message', message,
                                                         'created_at', comments.created_at
                                                              )) AS comments
                                          FROM comments
                                                   LEFT JOIN users ON comments.user_id = users.id
                                          GROUP BY post_id) AS comments ON posts.id = comments.post_id`);
  res.status(200).json(posts);
});

app.get("/dashboard/profile", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("profile", { user: req.session.user });
});

app.get("/dashboard/flights", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("flights.ejs", { user: req.session.user });
});

app.get("/dashboard/profile/edit", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("edit", { user: req.session.user });
});

app.get("/admin", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  if (req.session.user.role !== "admin") return res.redirect("/");
  res.render("admin");
});

app.get("/admin/users", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  if (req.session.user.role !== "admin") return res.redirect("/");
  const users = await db("users");
  res.render("users", { users });
});

app.get("/admin/users/:id", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  if (req.session.user.role !== "admin") return res.redirect("/");
  const user = await db("users").where({ id: req.params.id }).first();
  res.render("user", { user });
});

app.post("/post", upload.single("image"), async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const { title, content } = req.body;
  let fileName = null;
  if (req.file) {
    fileName = generateHashFilename(req.file.originalname);
    const path = `./public/uploads/${fileName}`;
    await sharp(req.file.buffer).resize(500).jpeg().toFile(path);
  }
  await db("posts").insert({
    user_id: req.session.user.id,
    title,
    content,
    image_url: fileName,
  });
  res.status(200).send("Post created successfully");
});

app.get("/auth", async (req, res) => {
  if (!req.session.user) return res.status(200).json();
  const user = await db("users").where({ id: req.session.user.id }).first();
  res.json(user);
});

app.post("/comment", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const { comment, post_id } = req.body;
  await db("comments").insert({
    user_id: req.session.user.id,
    post_id,
    message: comment,
  });
  res.redirect("/dashboard");
});

async function sendConfirmation(user, email) {
  const token = uuidv4();
  const mailOptions = {
    from: MAIL_USER,
    to: email,
    subject: "Account Confirmation",
    html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4CAF50;">Welcome to SAS Virtual!</h2>
            <p>Your account has been created successfully. Please click the link below to activate your account.</p>
            <a href="${
              process.env.FRONTEND_URL || "http://localhost:5173"
            }/confirm/${token}">Activate Account</a>
            <hr>
            <p>Best regards,</p>
            <p>SAS Virtual</p>
        </div>
    `,
  };

  await db("verification").insert({ user_id: user.id, code: token, email });

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) return console.log(error);
    console.log("Confirmation message sent: %s", info.messageId);
  });
}

app.get("/confirm/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const verification = await db("verification").where({ code: id }).first();
    await db("users")
      .where({ id: verification.user_id })
      .update({ is_active: true });
    await db("verification").where({ code: id }).delete();
  } catch (e) {
    console.log(e);
    return res.status(500).send("An error occurred");
  }
  res.status(200).send("Account activated successfully");
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(405).send("Username, email and password are required");
  const prevUser = await db("users").where({ username }).first();
  const currentUsers = await db("users").count("id as total").first();
  if (prevUser) return res.status(405).send("Username already exists");
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  db("users")
    .insert({
      username,
      email,
      role: currentUsers.total === 0 ? "admin" : "user",
      password: hash,
    })
    .returning("*")
    .then(async (user) => {
      await sendConfirmation(user[0], email);
      res.status(200).send("User registered successfully");
    })
    .catch((e) => {
      console.log(e);
      res.status(500).send("An error occurred");
    });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(405).send("Username and password are required");
  const user = await db("users").where({ username }).first();
  if (!user) return res.status(403).send("User not found");
  if (!user.is_active) return res.status(403).send("User is not active");

  const validPassword = bcrypt.compareSync(password, user.password);
  if (!validPassword)
    return res.status(403).send("Username and password do not match");
  req.session.user = user;
  res.json(user);
});

app.post("/send-email", async (req, res) => {
  const mailOptions = {
    from: MAIL_USER,
    to: MAIL_TO,
    subject: "Contact Form Submission",
    text: `Name: ${req.body.name}\nEmail: ${req.body.email}\nMessage: ${req.body.message}`,
  };

  await transporter.sendMail(mailOptions, async (error, info) => {
    if (error) return console.log(error);
    console.log("Message sent: %s", info.messageId);

    // Send confirmation email to the user
    const confirmationMailOptions = {
      from: MAIL_USER,
      to: req.body.email, // User's email address
      subject: "Your message has been sent",
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
      attachments: [
        {
          filename: "SASVirtual-mail.png",
          path: __dirname + "/public/img/SASVirtual-mail.png", // Ensure this path is correct
          cid: "logo", // Same cid value as in the html img src
        },
      ],
    };

    try {
      await transporter.sendMail(confirmationMailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
        console.log("Confirmation message sent: %s", info.messageId);
      });

      res.status(200).send("Message sent successfully");
    } catch (e) {
      console.log(e);
      res.status(500).send("An error occurred");
    }
  });
});

app.post("/dashboard/comments/delete", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const { id } = req.body;
  const userId = req.session.user.id;
  await db("comments").where({ id, user_id: userId }).delete();
  res.redirect("/dashboard");
});

app.post("/dashboard/posts/delete", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const { id } = req.body;
  const userId = req.session.user.id;
  await db("posts").where({ id, user_id: userId }).delete();
  res.redirect("/dashboard");
});

app.listen(3000, async () => {
  console.log("Server started... http://localhost:3000");
  db.raw("SELECT 1")
    .then(() => {
      console.log("Database connected");
    })
    .catch((err) => {
      console.log(err);
    });
});
