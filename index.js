const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const app = express();

const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

// ✅ MySQL pool config

require('dotenv').config();

const db = require("../backend/config/db"); // ✅ FIXED PATH



// ✅ Serve uploaded images with proper CORS
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res) => {
      res.set("Access-Control-Allow-Origin", "*");
    },
  })
);

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Ensure uploads folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, "uploads"),
  filename: (_, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ Routes
app.get("/", (_, res) => res.send("✅ API is working"));

// HTML form upload
app.get("/upload", (_, res) => {
  res.send(`
    <h2>Upload a File</h2>
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
  `);
});

app.post("/users_data", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { filename, mimetype, size } = req.file;
  const { user, email } = req.body; // <-- get user and email from body
  const filePath = `/uploads/${filename}`;

  if (!user || !email) {
    return res.status(400).json({ error: "User and email are required" });
  }

  db.query(
    "INSERT INTO users_data (filename, path, mimetype, size, user, email) VALUES (?, ?, ?, ?, ?, ?)",
    [filename, filePath, mimetype, size, user, email],
    (err, result) => {
      if (err)
        return res.status(500).json({ error: "Upload DB insert failed" });

      res.status(200).json({
        message: "✅ File uploaded and saved",
        fileId: result.insertId,
        filename,
        path: filePath,
        user,
        email,
      });
    }
  );
});

// GET /users – list all users
app.get("/users", (_, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: "Query error" });
    res.status(200).json(results);
  });
});

// POST /users – add new user

app.post("/users/post", (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ error: "Missing fields" });

  db.query(
    "INSERT INTO users (name, email) VALUES (?, ?)",
    [name, email],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Insert error" });
      res.status(201).json({ message: "User added", userId: result.insertId });
    }
  );
});

// Show uploaded images in HTML
app.get("/images", (_, res) => {
  db.query("SELECT filename, user, path FROM users_data", (err, results) => {
    if (err) return res.status(500).send("Failed to fetch images");

    const users = [...new Set(results.map((img) => img.user))];

    const imageTags = results
      .map(
        (img) => `
        <div style="margin:10px;">
          <img src="${API_URL}${img.path}" width="200">
          <p>User: ${img.user}</p>
        </div>
      `
      )
      .join("");

    res.send(`
      <h2>Uploaded Images</h2>
      <p>${users.length} unique user(s) uploaded images</p>
      <div style="display:flex;flex-wrap:wrap;">
        ${imageTags || "<p>No images uploaded yet.</p>"}
      </div>
    `);
  });
});

// GET /api/images – list images
app.get("/gets/images", (_, res) => {
  db.query(
    "SELECT id, filename, user, email, path FROM users_data",
    (err, results) => {
      if (err) return res.status(500).json({ error: "Failed to fetch images" });

      const images = results.map((img) => ({
        id: img.id,
        filename: img.filename,
        user: img.user,
        email: img.email,
        url: `${API_URL}${img.path}`,
      }));

      res.json(images);
    }
  );
});

// DELETE /images/:id – delete image
app.delete("/images/:id", (req, res) => {
  const imageId = Number(req.params.id);
  if (isNaN(imageId))
    return res.status(400).json({ error: "Invalid image ID" });

  db.query(
    "SELECT path FROM users_data WHERE id = ?",
    [imageId],
    (err, results) => {
      if (err) return res.status(500).json({ error: "Database select failed" });
      if (results.length === 0)
        return res.status(404).json({ error: "Image not found" });

      const filePath = path.join(__dirname, results[0].path);

      fs.unlink(filePath, (fsErr) => {
        if (fsErr)
          return res.status(500).json({ error: "File deletion failed" });

        db.query(
          "DELETE FROM users_data WHERE id = ?",
          [imageId],
          (deleteErr) => {
            if (deleteErr)
              return res.status(500).json({ error: "Database delete failed" });

            res.json({ success: true, message: "Image deleted successfully" });
          }
        );
      });
    }
  );
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
