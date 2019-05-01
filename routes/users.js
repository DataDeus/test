const express = require('express')
const router = express.Router()
const request = require('request');
const admin = require('firebase-admin')
const randomstring = require('randomstring')
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
/**
 * Checks if a user is signed in and if so, redirects to profile page.
 * @param {string} url The URL to check if signed in.
 * @return {function} The middleware function to run.
 */
router.get('/profile', function (req, res) {
	// Get session cookie.
});

router.use(attachCsrfToken('/acc_type/update/', 'csrfToken', (Math.random() * 100000000000000000).toString()));
router.use(attachCsrfToken('/acc/fund/', 'csrfToken', (Math.random() * 100000000000000000).toString()));
// If a user is signed in, redirect to profile page.

router.post('/acc/fund/', (req, res) => {
	var sessionCookie = req.cookies.session || '';
	// Get the session cookie and verify it. In this case, we are verifying if the
	// Firebase session was revoked, user deleted/disabled, etc.
	admin.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
		.then(function (decodedClaims) {
			// Serve content for signed in user.
			admin.auth().getUser(decodedClaims.sub).then(function (userRecord) {
				var headers = {
					'Authorization': 'Bearer sk_test_9108d6c808ad767e387c3a6db6a1e499df56e85e'
				};
				var options = {
					url: `https://api.paystack.co/transaction/verify/${req.body.reference}`,
					headers: headers
				};
				function callback(error, response, bud) {
					if (!error && response.statusCode == 200) {
						body = JSON.parse(bud);
						if (body.data.status == "failed") {
							res.status(402).send({
								result: body
							});
						}
						if (body.data.status == "abandoned") {
							res.status(444).send({
								result: body
							});
						}
						if (body.data.status == "success") {
							let AccountFund;
							usersRef.child(userRecord.uid).once('value', (snapshot) => {
								userDetails = snapshot.val();
								AccountFund = userDetails.AccountFunds;
								console.log(AccountFund);
								let NewAccFund = AccountFund + body.data.amount;
								let convertNewAccFund = NewAccFund / 100;
								let formattedconvertNewAccFund = convertNewAccFund.toLocaleString();
								usersRef.child(userRecord.uid).update({
									"AccountFunds": NewAccFund,
								}, function (err) {
									if (err) { } else {
										usersRef.child(userRecord.uid).child('fundsLog').push({
											"transaction_id": body.data.id,
											"currency": body.data.currency,
											"transaction_ref": body.data.reference,
											"transaction_type": 'credit',
											"customer_transaction_dets": body.data.customer,
											"amount": body.data.amount,
											"customer_transaction_dets": body.data.customer,
											"transaction_date": body.data.transaction_date,
											"ip_address": body.data.ip_address,
											"transaction_Authorization": body.data.authorization,
											"channel": body.data.channel
										}, function (err) {
											if (error) {

											} else {
												res.status(200).send({
													wallet: formattedconvertNewAccFund
												});
											}
										})
									}
								})
							})
						}
					}
				}
				request(options, callback);
			})
				.catch(function (error) {
					res.redirect('/');
				});
		}).catch(function (error) {
			// Force user to login.
			res.redirect('/');
		});
})
router.post('/accType/update/', (req, res) => {

	var sessionCookie = req.cookies.session || '';
	// Get the session cookie and verify it. In this case, we are verifying if the
	// Firebase session was revoked, user deleted/disabled, etc.
	admin.auth().verifySessionCookie(sessionCookie, true)
		.then(decodedClaims => {
			// Serve content for signed in user.
			admin.auth().getUser(decodedClaims.sub)
				.then(userRecord => {
					let disp;
					let dispSlug;
					if (req.body.acc_type == 'Client') {
						disp = 'CL';
						dispSlug = userRecord.displayName;
					}else if (req.body.acc_type == 'Merchant') {
						disp = 'MA';
						console.log(req.body.slug)
						dispSlug = req.body.slug;
					}
					usersRef.child(userRecord.uid).update({
						"user_type": req.body.acc_type,
						"slug": dispSlug,
						"urbanCode": `${disp}${req.cookies.urbanCodeGen}`
					})
						.then(() => {
							res.status(200).send({
								msg: req.body.acc_type
							})
						})
						.catch(error => {
							res.status(400).send({ msg: 'a brief error' })
						})
				})
				.catch(error => {
					res.status(400).send({
						msg: error
					})
				});
		})
		.catch(function (error) {
			// Force user to login.
			// console.log(error)
			res.send({
				msg: error
			})
		});
});

module.exports = router;