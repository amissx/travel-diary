require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const methodOverride = require('method-override');

const authRoutes = require('./routes/auth');
const travelRoutes = require('./routes/travels');
const { attachUser } = require('./middleware/auth');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

app.use(attachUser);

app.get('/', (req, res) => res.redirect('/travels'));
app.use('/', authRoutes);
app.use('/travels', travelRoutes);

app.use((req, res) => {
  res.status(404).send('Страница не найдена');
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/travel_diary';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB подключена');
    app.listen(PORT, () => console.log('Сервер запущен на http://localhost:' + PORT));
  })
  .catch((err) => {
    console.error('Ошибка подключения к MongoDB:', err.message);
    process.exit(1);
  });
