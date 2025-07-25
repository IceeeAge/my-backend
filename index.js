//index.js
const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_URL = process.env.API_URL;


// const PORT = process.env.PORT || 3000;
// const API_URL = process.env.API_URL || `http://localhost:${PORT}`;
// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// 
// Ensure uploads folder exists
const uploadImage = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadImage)) fs.mkdirSync(uploadImage);

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });



// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'suhud1313',
  database: 'mysql_database',
});

db.connect((err) => {
  if (err) return console.error('❌ Database connection error:', err);
  console.log('✅ Connected to MySQL');
});




// Routes
app.get('/', (req, res) => res.send('✅ API is working'));


// GET /upload – return HTML form
app.get('/upload', (req, res) => {
  res.send(`
    <h2>Upload a File</h2>
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
  `);
});



// POST /upload – handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { filename, mimetype, size } = req.file;
  const filePath = `/uploads/${filename}`;

  db.query(
    'INSERT INTO uploads (filename, path, mimetype, size) VALUES (?, ?, ?, ?)',
    [filename, filePath, mimetype, size],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Upload DB insert failed' });

      res.status(200).json({
        message: '✅ File uploaded and saved',
        fileId: result.insertId,
        filename,
        path: filePath,
      });
    }
  );
});



// GET /users – list all users
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: 'Query error' });
    res.status(200).json(results);
  });
});



// POST /users – add a new user
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  db.query(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Insert error' });
      res.status(201).json({ message: 'User added', userId: result.insertId });
    }
  );
});






// GET /api/images – list all images
app.get('/api/images', (req, res) => {
  db.query('SELECT id, filename, path FROM uploads', (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch images' });
    const images = results.map(img => ({
      id: img.id,
      filename: img.filename,
      url: `http://localhost:3000${img.path}`,
    }));

    res.json(images);
  });
});



// DELETE /api/images/:id – delete image by ID
app.delete('/images/:id', (req, res) => {
  const imageId = Number(req.params.id);
  if (isNaN(imageId)) {
    return res.status(400).json({ error: 'Invalid image ID' });
  }

  // First get the file path to delete it from the filesystem
  db.query('SELECT path FROM uploads WHERE id = ?', [imageId], (err, results) => {
    console.log('results', results);
    if (err) {
      console.error('❌ DB SELECT error:', err);
      return res.status(500).json({ error: 'Database select failed' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const filePath = results[0].path;

    // Delete file from filesystem
    fs.unlink(path.join(__dirname, filePath), (fsErr) => {
      if (fsErr) {
        console.error('❌ File delete error:', fsErr);
        return res.status(500).json({ error: 'File deletion failed' });
      }

      // Delete from database
      db.query('DELETE FROM uploads WHERE id = ?', [imageId], (deleteErr) => {
        if (deleteErr) {
          console.error('❌ DB DELETE error:', deleteErr);
          return res.status(500).json({ error: 'Database delete failed' });
        }

        res.json({ success: true, message: 'Image deleted successfully' });
      });
    });
  });
});



app.listen(PORT, () => {
  console.log(`🚀 Server running at ${API_URL}`);
});