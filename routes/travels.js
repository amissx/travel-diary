const express = require('express');
const multer = require('multer');
const path = require('path');
const Travel = require('../models/Travel');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(null, ok);
  }
});

router.get('/', requireAuth, async (req, res) => {
  const travels = await Travel.find().sort({ createdAt: -1 }).populate('author', 'username');
  res.render('travels/list', { travels });
});

router.get('/mine', requireAuth, async (req, res) => {
  const travels = await Travel.find({ author: req.session.userId }).sort({ createdAt: -1 });
  res.render('travels/mine', { travels });
});

router.get('/new', requireAuth, (req, res) => {
  res.render('travels/new', { error: null });
});

router.post('/', requireAuth, upload.array('images', 6), async (req, res) => {
  try {
    const { title, description, locationName, lat, lng, cost } = req.body;

    if (!title || !description || !locationName || !lat || !lng || !cost) {
      return res.render('travels/new', { error: 'Заполните все обязательные поля' });
    }

    const images = (req.files || []).map((f) => '/uploads/' + f.filename);

    await Travel.create({
      title,
      description,
      author: req.session.userId,
      authorName: req.session.username,
      location: { name: locationName, lat: parseFloat(lat), lng: parseFloat(lng) },
      cost: parseFloat(cost),
      images
    });

    res.redirect('/travels');
  } catch (err) {
    console.error(err);
    res.render('travels/new', { error: 'Ошибка при создании записи' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  const travel = await Travel.findById(req.params.id).populate('author', 'username');
  if (!travel) {
    return res.redirect('/travels');
  }
  res.render('travels/detail', { travel });
});

module.exports = router;
