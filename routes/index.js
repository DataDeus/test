const express = require('express');
const router = express.Router();
const admin = require('firebase-admin')
const FIREBASE_DATABASE = admin.database()
const usersRef = FIREBASE_DATABASE.ref('users')

/* GET home page. */
router.post('/usersession', function (req, res) {
  // Get ID token and CSRF token.
  var idToken = req.body.idToken.toString();
  var csrfToken = req.body.csrfToken.toString();
  var urbanCodeGen = req.body.urbanCodeGen.toString();

  // Guard against CSRF attacks.
  if (!req.cookies || csrfToken !== req.cookies.csrfToken) {
    res.status(401).send('UNAUTHORIZED REQUEST!');
    return;
  }
  // Set session expiration to 5 days.
  var expiresIn = 60 * 60 * 24 * 5 * 1000;
  // Create the session cookie. This will also verify the ID token in the process.
  // The session cookie will have the same claims as the ID token.
  // We could also choose to enforce that the ID token auth_time is recent.
  admin.auth().verifyIdToken(idToken).then(function (decodedClaims) {
    // In this case, we are enforcing that the user signed in in the last 5 minutes.
    if (new Date().getTime() / 1000 - decodedClaims.auth_time < 5 * 60) {
      return admin.auth().createSessionCookie(idToken, { expiresIn: expiresIn });
    }
    throw new Error('UNAUTHORIZED REQUEST!');
  })
    .then(function (sessionCookie) {
      // Note httpOnly cookie will not be accessible from javascript.
      // secure flag should be set to true in production.
      var options = { maxAge: expiresIn, httpOnly: true, secure: false /** to test in localhost */ };
      res.cookie('session', sessionCookie, options);
      res.cookie('urbanCodeGen', urbanCodeGen, options);
      res.end(JSON.stringify({ status: 'success' }));
    })
    .catch(function (error) {
      res.status(401).send('UNAUTHORIZED REQUEST!');
    });
});

/** User signout endpoint. */
router.get('/logout', function (req, res) {
  // Clear cookie.
  var sessionCookie = req.cookies.session || '';
  res.clearCookie('session');
  // Revoke session too. Note this will revoke all user sessions.
  if (sessionCookie) {
    admin.auth().verifySessionCookie(sessionCookie, true).then(function (decodedClaims) {
      return admin.auth().revokeRefreshTokens(decodedClaims.sub);
    })
      .then(function () {
        // Redirect to login page on success.
        res.redirect('/auth/login');
      })
      .catch(function () {
        // Redirect to login page on error.
        res.redirect('/auth/login');
      });
  } else {
    // Redirect to login page when no session cookie available.
    res.redirect('/auth/login');
  }
});

router.get('/', function (req, res, next) {
  const sessionCookie = req.cookies.session;
  var user = null;
  if (sessionCookie) {
    admin.auth().verifySessionCookie(sessionCookie)
      .then(function (decodedClaims) {
        console.log(decodedClaims.name)
        user = decodedClaims.name;
        res.render('index', { title: 'Urban Frisson', user: user });
      })
      .catch(function (error) {
        res.render('index', { title: 'Urban Frisson', user: null });
      });
  } else {
    res.render('index', { title: 'Urban Frisson', user: null });
  }
});

module.exports = router;
