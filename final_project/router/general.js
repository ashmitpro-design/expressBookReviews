const express = require('express');
const axios = require('axios');
const books = require('./booksdb');
const { isValid, addUser } = require('./auth_users');
const public_users = express.Router();
public_users.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(username) || ['__proto__', 'constructor', 'prototype'].includes(username) || typeof password !== 'string' || !password.trim() || password.length > 256) {
    return res.status(400).json({ message: 'Provide a valid username and password.' });
  }
  if (isValid(username)) return res.status(409).json({ message: 'Username already exists.' });
  addUser(username, password);
  res.status(201).json({ message: 'Registration successful. Please log in.' });
});
// The supplied booksdb.js JSON object is the sole data source.
// This separate endpoint enables real Axios HTTP calls without route recursion.
public_users.get('/_catalog', (req, res) => res.json(books));
async function retrieveBooks(req) {
  const response = await axios.get(req.app.locals.catalogURL, { timeout: 5000, proxy: false });
  return response.data;
}
function retrieval(select) {
  return async (req, res, next) => {
    try {
      const result = select(await retrieveBooks(req), req);
      if (result === undefined) return res.status(404).json({ message: 'Book not found.' });
      res.json(result);
    } catch (err) { next(err); }
  };
}
// All four retrieval tasks use Axios with async/await in general.js.
public_users.get('/', retrieval(catalog => catalog));
public_users.get('/isbn/:isbn', retrieval((catalog, req) => Object.hasOwn(catalog, req.params.isbn) ? catalog[req.params.isbn] : undefined));
public_users.get('/author/:author', retrieval((catalog, req) => Object.fromEntries(Object.entries(catalog).filter(([, book]) => book.author.toLowerCase() === req.params.author.toLowerCase()))));
public_users.get('/title/:title', retrieval((catalog, req) => Object.fromEntries(Object.entries(catalog).filter(([, book]) => book.title.toLowerCase() === req.params.title.toLowerCase()))));
public_users.get('/review/:isbn', retrieval((catalog, req) => Object.hasOwn(catalog, req.params.isbn) ? catalog[req.params.isbn].reviews : undefined));
module.exports.general = public_users;
