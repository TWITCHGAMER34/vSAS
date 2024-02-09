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
    await db.raw(`SELECT posts.id, user_id, title, content, image_url, posts.created_at, username
                  FROM posts
                           JOIN users ON posts.user_id = users.id
                  WHERE posts.user_id = posts.user_id
                  ORDER BY posts.created_at DESC`);
  res.status(200).json(posts);
});

app.get("/comments/:id", async (req, res) => {
    const { id } = req.params;
    const comments = await db.raw(`SELECT comments.id, user_id, post_id, message, comments.created_at, username
                                   FROM comments
                                            JOIN users ON comments.user_id = users.id
                                   WHERE comments.post_id = ?
                                   ORDER BY comments.created_at DESC;`, [id]);
    res.status(200).json(comments);
});

app.get("/admin/users", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  if (req.session.user.role !== "admin") return res.redirect("/");
  const users = await db("users");
  res.status(200).json( users);
});

app.get("/admin/posts", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.role !== "admin") return res.redirect("/");
    const posts = await db("posts");
    res.status(200).json(posts);
});

app.get("/admin/comments", async (req, res) => {
    if (!req.session.user) return res.redirect("/login");
    if (req.session.user.role !== "admin") return res.redirect("/");
    const comments = await db("comments");
    res.status(200).json(comments);
});

app.post("/post", upload.single("image"), async (req, res) => {
  if (!req.session.user) return res.status(401).send("Unauthorized");
  const { title, content } = req.body;
  let fileName = null;
    console.log(req.file)
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
  res.status(200).send("Comment created successfully");
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
  });


  const confirmationMailOptions = {
    from: MAIL_USER,
    to: email,
    subject: "Your message has been sent",
    html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #4CAF50;">Thank you for contacting us!</h2>
            <p>Your message has been sent successfully. We will get back to you shortly.</p>
            <hr>
            <h3>Your Message:</h3>
            <p>${message}</p>
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

    await transporter.sendMail(confirmationMailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).send("Error")
      }
      console.log("Confirmation message sent: %s", info.messageId);
    });

    res.status(200).send("Message sent successfully");
});

app.patch("/profile/newPassword", async (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");
    const { oldPassword, password } = req.body;
    if (!oldPassword || !password) return res.status(405).send("Old password and new password are required");
    const user = await db("users").where({ id: req.session.user.id }).first();
    const validPassword = bcrypt.compareSync(oldPassword, user.password);
    if (!validPassword) return res.status(403).send("Old password is incorrect");
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);
    await db("users").where({ id: req.session.user.id }).update({ password: hash });
    res.status(200).send("Password updated successfully");
});

app.patch("/profile/newUsername", async (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");
    const { username } = req.body;
    await db("users").where({ id: req.session.user.id }).update({ username });
    res.status(200).send("Username updated successfully");
});

app.delete("/profile", async (req, res) => {
    if (!req.session.user) return res.status(401).send("Unauthorized");
    await db("users").where({ id: req.session.user.id }).delete();
    res.status(200).send("User deleted successfully");
});

app.delete("/admin/users/:id", async (req, res) => {
  if (!req.session.user) return res.status(401).send("Unauthorized");
  if (req.session.user.role !== "admin") return res.status(401).send("Unauthorized");
  const { id } = req.params;
  await db("users").where({ id }).delete();
  res.status(200).send("User deleted successfully");
});

app.delete("/admin/posts/:id", async (req, res) => {
  if (!req.session.user) return res.status(401).send("Unauthorized");
  if (req.session.user.role !== "admin") return res.status(401).send("Unauthorized");
  const { id } = req.params;
  await db("posts").where({ id }).delete();
  res.status(200).send("Post deleted successfully");
});

app.delete("/admin/comments/:id", async (req, res) => {
  if (!req.session.user) return res.status(401).send("Unauthorized");
  if (req.session.user.role !== "admin") return res.status(401).send("Unauthorized");
  const { id } = req.params;
  await db("comments").where({ id }).delete();
  res.status(200).send("Comment deleted successfully");
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
