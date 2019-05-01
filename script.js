const randomstring = require('randomstring');
const firebase = require('firebase');
const config = require('./config.js');
const $ = require('jquery');

// Initialize Firebase app.
firebase.initializeApp(config);

function getCookie(name) {
	const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
	return v ? v[2] : null;
}

function signInWithGoogle() {
	var googleprovider = new firebase.auth.GoogleAuthProvider();
	firebase.auth().signInWithPopup(googleprovider).then((claims) => {
		handleSignedInUser(claims.user);
	})
		.catch((error) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			console.log(errorCode);
			console.log(errorMessage);
		})
}
function signInWithEmail() {
	let email = document.getElementById('LoginEmail').value;
	let password = document.getElementById('LoginPassword').value;
	firebase.auth().signInWithEmailAndPassword(email, password)
		.then((user) => {
			console.log(user)
		})
		.catch(function (err) {
			const errorCode = err.code;
			const errorMessage = err.message;
			console.log(errorCode);
			console.log(errorMessage);
		});
}
function createUserWithEmail() {
	let displayName = document.getElementById('RegisterFullname').value;
	let email = document.getElementById('RegisterEmail').value;
	let account_type = document.getElementById('account_type').value;
	let password = document.getElementById('RegisterPassword').value;
	let password1 = document.getElementById('RegisterPassword1').value;

	if (displayName != "" && email != "" && password != "" && account_type != "" && password1 != "" && password == password1) {
		document.getElementById('RegisterBtn').style.background = "#fff";
		document.getElementById('RegisterBtn').innerHTML = '<img src="/images/load.gif" width="40px" height="40px" margin-top: -1%;>';
		firebase.auth().createUserWithEmailAndPassword(email, password)
			.then(() => {
				var check = (user) => {
					user.updateProfile({
						displayName: displayName,
						photoURL: "/images/avatars/user.png",
						gender: "male"
					}).then(() => {
						handleSignedInUser(user);
					}).catch((error) => {
						// An error happened.
					});
				}
				firebase.auth().onAuthStateChanged(check)
				// handleSignedInUser(user, displayName);
			}).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode == "auth/email-already-in-use") {
					firebase.auth().fetchProvidersForEmail(email).then((result) => {
						const Toast = Swal.mixin({
							toast: true,
							position: 'top-end',
							showConfirmButton: false,
							timer: 4000
						});

						Toast.fire({
							type: 'error',
							title: `The email is already connected using ${result[0]}  ` +
								`click on the log in with ${result[0]} to login`
						})
					})
				}
				document.getElementById('RegisterBtn').style.background = "linear-gradient(to right, #e27a8d, #f17187)";
				document.getElementById('RegisterBtn').innerHTML = 'Register';

			})
	} else {
		const Toast = Swal.mixin({
			toast: true,
			position: 'top-end',
			showConfirmButton: false,
			timer: 3000
		});

		Toast.fire({
			type: 'error',
			title: 'Fill the form correctly and cross check if your passwords match'
		})
	}
}
function FacebookSignIn() {
	const provider = firebase.auth.FacebookAuthProvider();
	firebase.auth().signInWithRedirect(provider).then((result) => {
		// This gives you a Google Access Token. You can use it to access the Google API.
		const token = result.credential.accessToken;
		// The signed-in user info.
		const user = result.user;
		// ...
		handleSignedInUser(user);
	})
}
var handleSignedInUser = function (user) {
	console.log(user.displayName)
	let spliceName = user.displayName.slice(0, 4).toUpperCase();
	let rand = randomstring.generate({
		length: '4',
		charset: 'numeric'
	})
	let urbanCodeGen = `${spliceName}${rand}`;
	const Toast = Swal.mixin({
		toast: true,
		position: 'top-end',
		showConfirmButton: false,
		timer: 2000
	});

	Toast.fire({
		type: 'success',
		title: `Welcome ${user.displayName}`
	})
	user.getIdToken().then((idToken) => {
		const csrfToken = getCookie('csrfToken')
		return postIdTokenToUserSession('/usersession', idToken, csrfToken, urbanCodeGen)
			.then((result) => {
				return checkforFirstTime(user)
					.then(() => {
						window.location.assign('../dashboard');
					})
			})
			.catch((error) => {
				window.location.assign('/')
			})
	})
}

var checkforFirstTime = function (user) {
	return new Promise((resolve, reject) => {
		firebase.database().ref('users').orderByChild("userID").equalTo(user.uid).once("value", (snapshot) => {
			var cj = snapshot.val();
			var exists = (snapshot.val() !== null);
			if (exists) {
				resolve();
			} else {
				firebase.database().ref('users/').child(user.uid).set({
					userID: user.uid,
					displayName: user.displayName,
					email: user.email,
					photoURL: user.photoURL,
					providerId: user.providerId,
					AccountFunds: 0
				}, function (err) {
					if (!err) {
						resolve();
					} else {
						reject();
					}
				});
			}
		});
	})
};
var postIdTokenToUserSession = function (url, idToken, csrfToken, urbanCodeGen) {
	return $.ajax({
		type: 'POST',
		url: url,
		data: { idToken: idToken, csrfToken: csrfToken, urbanCodeGen: urbanCodeGen },
		contentType: 'application/x-www-form-urlencoded'
	});
};
var currentUrl = window.location.href.split('/');

document.getElementById("hoist_google").addEventListener("click", function () {
	signInWithGoogle();
});
document.getElementById("hoist_facebook").addEventListener("click", function () {
	signInWithFacebook();
});
if (currentUrl[4] == 'login') {
	document.getElementById("LoginBtn").addEventListener("click", function () {
		signInWithEmail();
	});
} else {
	document.getElementById("RegisterBtn").addEventListener("click", function () {
		createUserWithEmail();
	});
}
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);