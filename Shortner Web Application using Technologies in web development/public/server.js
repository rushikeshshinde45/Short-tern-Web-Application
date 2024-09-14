const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = 'mongodb://localhost:27017/url-shortener'; // Replace with your MongoDB URI

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));

// Define URL schema and model
const urlSchema = new mongoose.Schema({
  originalUrl: String,
  shortUrl: String,
});
const Url = mongoose.model('Url', urlSchema);

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Routes
app.post('/shorten', async (req, res) => {
  const { url } = req.body;
  try {
    let urlEntry = await Url.findOne({ originalUrl: url });
    if (!urlEntry) {
      const shortUrl = shortid.generate();
      urlEntry = new Url({ originalUrl: url, shortUrl });
      await urlEntry.save();
    }
    res.json({ shortUrl: `${req.headers.host}/${urlEntry.shortUrl}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/:shortUrl', async (req, res) => {
  try {
    const urlEntry = await Url.findOne({ shortUrl: req.params.shortUrl });
    if (urlEntry) {
      res.redirect(urlEntry.originalUrl);
    } else {
      res.status(404).json({ error: 'URL not found' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
