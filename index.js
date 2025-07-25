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

const pool = mysql.createPool({
  host: 'bx6hfmfa3xzzoaanhrg6-mysql.services.clever-cloud.com',
  user: 'u4wrzcqi32x7teyj',
  password: 'Glhf5OcDLSKP1Mn5oNmG',
  database: 'bx6hfmfa3xzzoaanhrg6',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL connection error:', err);
  } else {
    console.log('✅ Connected to MySQL database');
    connection.release();
  }
});






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

// POST /upload – handle file upload
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { filename, mimetype, size } = req.file;
  const filePath = `/uploads/${filename}`;

  db.query(
    "INSERT INTO uploads (filename, path, mimetype, size) VALUES (?, ?, ?, ?)",
    [filename, filePath, mimetype, size],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Upload DB insert failed" });

      res.status(200).json({
        message: "✅ File uploaded and saved",
        fileId: result.insertId,
        filename,
        path: filePath,
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
app.post("/users", (req, res) => {
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

// GET /api/images – list images
app.get("/api/images", (_, res) => {
  db.query("SELECT id, filename, path FROM uploads", (err, results) => {
    if (err) return res.status(500).json({ error: "Failed to fetch images" });

    const images = results.map((img) => ({
      id: img.id,
      filename: img.filename,
      url: `${API_URL}${img.path}`,
    }));

    res.json(images);
  });
});

// DELETE /images/:id – delete image
app.delete("/images/:id", (req, res) => {
  const imageId = Number(req.params.id);
  if (isNaN(imageId)) return res.status(400).json({ error: "Invalid image ID" });

  db.query("SELECT path FROM uploads WHERE id = ?", [imageId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database select failed" });
    if (results.length === 0) return res.status(404).json({ error: "Image not found" });

    const filePath = path.join(__dirname, results[0].path);

    fs.unlink(filePath, (fsErr) => {
      if (fsErr) return res.status(500).json({ error: "File deletion failed" });

      db.query("DELETE FROM uploads WHERE id = ?", [imageId], (deleteErr) => {
        if (deleteErr) return res.status(500).json({ error: "Database delete failed" });

        res.json({ success: true, message: "Image deleted successfully" });
      });
    });
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at ${API_URL}`);
});
