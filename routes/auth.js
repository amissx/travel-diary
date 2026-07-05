const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, passwordConfirm } = req.body;

    if (!username || !password) {
      return res.render('register', { error: 'Заполните все поля' });
    }
    if (password !== passwordConfirm) {
      return res.render('register', { error: 'Пароли не совпадают' });
    }

    const existing = await User.findOne({ username });
    if (existing) {
      return res.render('register', { error: 'Такой пользователь уже существует' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash });

    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect('/travels');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Ошибка регистрации' });
  }
});

router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', { error: 'Неверный логин или пароль' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.render('login', { error: 'Неверный логин или пароль' });
    }

    req.session.userId = user._id;
    req.session.username = user.username;
    res.redirect('/travels');
  } catch (err) {
    console.error(err);
    res.render('login', { error: 'Ошибка входа' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
