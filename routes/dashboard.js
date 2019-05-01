const express = require('express')
const router = express.Router()
const paystack = require('paystack')('sk_test_9108d6c808ad767e387c3a6db6a1e499df56e85e')
const randomstring = require('randomstring');
const numeral = require('numeral');
const admin = require('firebase-admin')
const FIREBASE_DATABASE = admin.database()
const usersRef = FIREBASE_DATABASE.ref('users')

function attachCsrfToken(url, cookie, value) {
    return function (req, res, next) {
        if (req.url == url) {
            res.cookie(cookie, value);
        }
        next();
    }
}

function generateUrbanCode(details) {
    return function (req, res, next) {

        if (req.url) {

            let spliceName = details.splice(0, 4).toUpperCase();
            let rand = randomstring.generate({
                length: '4',
                charset: 'numeric'
            })
            let urbanCodeGen = `${spliceName}${rand}`;
            // var options = { maxAge: expiresIn, httpOnly: true, secure: false /** to test in localhost */ };
            res.cookie('urbanCodeGen', urbanCodeGen);
        }
        next();
    }
}

function checkIfSignedIn() {
    return function (req, res, next) {
        var sessionCookie = req.cookies.session || '';
        // User already logged in. Redirect to profile page.
        admin.auth().verifySessionCookie(sessionCookie).then(function (decodedClaims) {
            //   console.log(decodedClaims)
            next();
        }).catch(function (error) {
            res.redirect('/auth/login');
        });
    }
}

router.use(attachCsrfToken('/', 'csrfToken', (Math.random() * 100000000000000000).toString()));
// If a user is signed in, redirect to profile page.
router.use(checkIfSignedIn());
/* GET users listing. */
router.get('/', (req, res, next) => {
    var sessionCookie = req.cookies.session || '';
    // Get the session cookie and verify it. In this case, we are verifying if the
    // Firebase session was revoked, user deleted/disabled, etc.
    admin.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
        .then(function (decodedClaims) {
            // Serve content for signed in user.
            admin.auth().getUser(decodedClaims.sub).then(function (userRecord) {
                usersRef.child(userRecord.uid).once('value', (snapshot) => {
                    userDetails = snapshot.val();
                    let sliceFund = ""+ userDetails.AccountFunds;
                    let formattedAccountFunds = numeral(sliceFund.slice(0, -2)).format('0,0');
                    if (!userRecord.urbanCode) {
                        generateUrbanCode(userRecord.displayName)
                    }
                    res.render('wallet/index', { user: userRecord, userData: userDetails, funds: formattedAccountFunds })
                })
            }).catch(function (error) {
                res.redirect('/');
            });
        }).catch(function (error) {
            // Force user to login.
            res.redirect('/');
        });
});
module.exports = router;