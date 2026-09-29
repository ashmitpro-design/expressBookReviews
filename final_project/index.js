const express = require('express');
const session = require('express-session');
const { randomBytes } = require('node:crypto');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/customer', session({ secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'), resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', maxAge: 3600000 } }));
app.use('/customer/auth', (req, res, next) => {
  if (!req.session.username) return res.status(401).json({ message: 'Please log in first.' });
  next();
});
app.use('/customer', require('./router/auth_users').authenticated);
app.use('/', require('./router/general').general);
app.use((err, req, res, next) => res.status(err.status || 500).json({ message: err.status === 400 ? 'Invalid JSON body.' : 'Unable to process request.' }));
function start(port = process.env.PORT || 5000) {
  const server = app.listen(port, '127.0.0.1', () => {
    app.locals.catalogURL = `http://127.0.0.1:${server.address().port}/_catalog`;
    console.log(`Server is running on port ${server.address().port}`);
  });
  return server;
}
if (require.main === module) start();
module.exports = { app, start };
