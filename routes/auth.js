const express = require('express')
const router = express.Router()
const firebase = require('firebase/app')
require('firebase/auth')
require('firebase/database')
const admin = require('firebase-admin')

function attachCsrfToken(url, cookie, value) {
  return function (req, res, next) {
    if (req.url == url) {
      res.cookie(cookie, value);
    }
    next();
  }
}
/**
 * Checks if a user is signed in and if so, redirects to profile page.
 * @param {string} url The URL to check if signed in.
 * @return {function} The middleware function to run.
 */
function checkIfSignedIn() {
  return function (req, res, next) {
    var sessionCookie = req.cookies.session || '';
    // User already logged in. Redirect to profile page.
    admin.auth().verifySessionCookie(sessionCookie).then(function (decodedClaims) {
      console.log(decodedClaims)
      res.redirect('/dashboard');
    }).catch(function (error) {
      next();
    });
  }
}

router.use(attachCsrfToken('/', 'csrfToken', (Math.random() * 100000000000000000).toString()));
router.use(attachCsrfToken('/login', 'csrfToken', (Math.random() * 100000000000000000).toString()));
router.use(attachCsrfToken('/signup', 'csrfToken', (Math.random() * 100000000000000000).toString()));
router.use(attachCsrfToken('/recovery', 'csrfToken', (Math.random() * 100000000000000000).toString()));
// If a user is signed in, redirect to profile page.
router.use(checkIfSignedIn());

router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Urban Frisson' });
})

router.get('/signup', (req, res) => {
  res.redirect('/auth/login');
  // res.render('auth/register', { title: 'Urban Frisson' });
})

router.get('/recovery', (req, res) => {
  res.render('auth/recovery', { title: 'Urban Frisson' });
})

module.exports = router;