const express = require('express');
const { randomBytes, scryptSync, timingSafeEqual } = require('node:crypto');
const books = require('./booksdb');
const regd_users = express.Router();
const users = [];
const isValid = username => users.some(user => user.username === username);
function addUser(username, password) {
  const salt = randomBytes(16).toString('hex');
  users.push({ username, salt, hash: scryptSync(password, salt, 64) });
}
function authenticatedUser(username, password) {
  const user = users.find(user => user.username === username);
  return !!user && typeof password === 'string' && password.length <= 256 && timingSafeEqual(user.hash, scryptSync(password, user.salt, 64));
}
regd_users.post('/login', (req, res, next) => {
  const { username, password } = req.body || {};
  if (!authenticatedUser(username, password)) return res.status(401).json({ message: 'Invalid username or password.' });
  req.session.regenerate(err => {
    if (err) return next(err);
    req.session.username = username;
    req.session.save(err => {
      if (err) return next(err);
      res.json({ message: 'Login successful.', username });
    });
  });
});
regd_users.put('/auth/review/:isbn', (req, res) => {
  if (!Object.hasOwn(books, req.params.isbn)) return res.status(404).json({ message: 'Book not found.' });
  const review = req.body?.review ?? req.query.review;
  if (typeof review !== 'string' || !review.trim()) return res.status(400).json({ message: 'A non-empty review is required.' });
  books[req.params.isbn].reviews[req.session.username] = review.trim();
  res.json({ message: 'Review added or updated.', reviews: books[req.params.isbn].reviews });
});
regd_users.delete('/auth/review/:isbn', (req, res) => {
  if (!Object.hasOwn(books, req.params.isbn)) return res.status(404).json({ message: 'Book not found.' });
  const reviews = books[req.params.isbn].reviews;
  if (!Object.hasOwn(reviews, req.session.username)) return res.status(404).json({ message: 'Your review was not found.' });
  delete reviews[req.session.username];
  res.json({ message: 'Your review was deleted.', reviews });
});
module.exports = { authenticated: regd_users, isValid, users, addUser };
