const firebase = require('firebase');
const config = require('./config');
const $ = require('jquery');
const numeral = require('numeral');
const moment = require('moment');
const userDetails = document.getElementById('userDetails').value;
const userSplit = userDetails.split(',');
let userToPay = '';
let userAmount = '';
// Initialize Firebase app.
firebase.initializeApp(config);
const db = firebase.database();
const usersDb = db.ref('users');

db.ref('users').child(userSplit[3]).child('AccountFunds').on('value', (snapshot) => {
	userAmount = snapshot.val();
	let serAmount = "" + snapshot.val();
	document.getElementById('WalletFund').innerHTML = numeral(serAmount.slice(0, -2)).format('0,0');
})

db.ref('users').child(userSplit[3]).child('fundsLog').on('value', (snapshot) => {
	let log = snapshot.val();
	let html = '';
	if (log) {
		let logArray = [];
		checks = true;
		if (log) {
			for (let key in log) {
				logArray.push(log[key])
				let serAmount = "" + log[key].amount;
				let SignType = function () {
					if (log[key].transaction_type == "credit") {
						return '+';
					} else {
						return '-';
					}
				}
				let StatusType = function () {
					if (log[key].transaction_type == "credit") {
						return 'Credit';
					} else {
						return 'Debit';
					}
				}
				html = `
				<div class="transaction">
		
					<div class="transaction__header transaction__header--five-cols">
						<div class="transaction__data">
								${moment(log[key].transaction_date).startOf('hour').fromNow()}
						</div>
		
						<div class="transaction__currency">
							<div class="transaction_Curr">
							<img src="/images/icons/purse.png" width="20px">	
							</div>					   
						</div>
		
						<div class="transaction__info">
							<img src="/wallet/img/transaction-icon-${log[key].transaction_type}.svg" alt="">
							${log[key].transaction_ref}
						</div>
		
						<div class="transaction__status">
							<div class="status status--sent">
								${StatusType()}
							</div>
						</div>
		
						<div class="transaction__course">
							<span class="rate rate--pending">${SignType()} NGN ${numeral(serAmount.slice(0, -2)).format('0,0')}</span>
						</div>
					</div>
		
					<div class="transaction__body">
						<ul class="transaction__details">
							<li>
								<span>Sender name:</span> Andrew Smith
							</li>
							<li>
								<span>Sender adress:</span> 3Bhe5sbhSTNxcDpYyyWkyN76YReDs8wFv8
							</li>
							<li>
								<span>Condition:</span> Sent
							</li>
						</ul>
					</div>							
		
				</div>${html}`;
			}
		}
	} else {
		html = `<h3>You Have no Transaction History</h3>`;
	}
	$('#render_here').html(html);
});

function PayWithPaystack() {
	return new Promise((resolve, reject) => {
		var amount = document.getElementById('fundingDets').value;
		var email = userSplit[1];
		if (amount == "") {
			reject('Amount is required');
		} else {
			var handler = PaystackPop.setup({
				key: 'pk_test_419ea234c7e712944a47fe813b7fc22faa3b6d29',
				email: email,
				currency: "NGN",
				amount: `${amount}00`,
				metadata: {
					custom_fields: [{
						display_name: userSplit[0],
						variable_name: "mobile_number",
						phoneNumber: userSplit[2]
					}]
				},
				callback: function (response) {
					resolve(response);
				},
			})
			handler.openIframe();
			document.getElementById('fundingDets').value = '';
			// $(".mfp-bg").hide();
			// $(".mfp-wrap").hide();
			// document.getElementByClassName('mfp-bg').style.display = "none";
		}
	})
		.then((response) => {
			document.getElementsByClassName("mfp-close")[0].click();
			const Toast = Swal.mixin({
				toast: true,
				position: 'bottom',
				showConfirmButton: false,
				timer: 3000
			});

			Toast.fire({
				type: 'info',
				title: 'Verifying...'
			})
			$.ajax({
				url: 'users/acc/fund/',
				type: 'POST',
				data: `reference=${response.reference}`,
				dataType: 'json'
			})
				.then((_result) => {
					const Toast = Swal.mixin({
						toast: true,
						position: 'bottom',
						showConfirmButton: false,
						timer: 3000
					});

					Toast.fire({
						type: 'success',
						title: 'Funds Added Successfully'
					})
					// document.getElementById('WalletFund').innerHTML = result.wallet;
				})
				.catch((err) => {
					console.log(err)
				})
		})
		.catch((msg) => {
			const Toast = Swal.mixin({
				toast: true,
				position: 'bottom',
				showConfirmButton: false,
				timer: 3000
			});

			Toast.fire({
				type: 'error',
				title: msg
			})
		})
}

document.getElementById("fundAccount").addEventListener("click", function () {
	PayWithPaystack();
});
const rec = document.getElementById('urbanCodeRec');
rec.addEventListener("blur", () => {
	document.getElementById("payAccount").disabled = true;
	document.getElementById('payAccount').innerHTML = '<img src="/images/i.gif" width="40px;">'
	const Toast = Swal.mixin({
		toast: true,
		position: 'bottom',
		showConfirmButton: false,
		timer: 3000
	});
	if (rec.value == userSplit[4]) {
		document.getElementById("payAccount").disabled = true;
		document.getElementById('payAccount').innerHTML = 'PAY FROM WALLET'
		Toast.fire({
			type: 'info',
			title: `Code should not be your own`
		})
	} else {
		db.ref('users').orderByChild('urbanCode').equalTo(rec.value).once('value', (snapshot) => {
			let ownerCode = snapshot.val();
			if (ownerCode) {
				document.getElementById("payAccount").disabled = false;
				document.getElementById('payAccount').innerHTML = 'PAY FROM WALLET'
				for (let key in ownerCode) {
					userToPay = `${ownerCode[key].slug}!${key}!${ownerCode[key].AccountFunds}!${ownerCode[key].email}!${ownerCode[key].displayName}`;
				}
			} else {
				userToPay = rec.value
				document.getElementById("payAccount").disabled = false;
				document.getElementById('payAccount').innerHTML = 'PAY FROM WALLET'
				Toast.fire({
					type: 'info',
					title: `User with code ${rec.value} not found`
				})
			}
		})
	}
})

document.getElementById('payAccount').addEventListener('click', () => {
	const Toast = Swal.mixin({
		toast: true,
		position: 'bottom',
		showConfirmButton: false,
		timer: 3000
	});
	let urbanCode = document.getElementById("urbanCodeRec").value;
	let urbansendAmount = document.getElementById("paymentDets").value;
	(urbanCode == "" || urbansendAmount == "") ?
	Toast.fire({
		type: 'error',
		title: `Fill all details`
	}) : Swal.fire({
		title: 'Are you sure?',
		text: `You are about to transfer NGN${numeral(urbansendAmount).format('0,0')} to ${userToPay.split('!')[0]}`,
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, Transfer it'
	}).then((result) => {
		if (result.value) {
			document.getElementById("payAccount").disabled = true;
			document.getElementById('payAccount').innerHTML = '<img src="/images/i.gif" width="40px;">'
			document.getElementById("urbanCodeRec").disabled = true;
			document.getElementById("paymentDets").disabled = true;
			urbansendAmount = `${urbansendAmount}00`;
			let monitor = db.ref(`users/${userToPay.split('!')[1]}/AccountFunds`)
			let CurrentMonitor = db.ref(`users/${userSplit[3]}/AccountFunds`)
			urbansendAmount = Number(urbansendAmount);
			(urbansendAmount <= userAmount) ?
				monitor.transaction(function (fund) {
					return fund + urbansendAmount;
				}, function (error, _committed, _snapshot) {
					if (error) {
						document.getElementById("payAccount").disabled = false;
						document.getElementById('payAccount').innerHTML = 'PAY FROM WALLET'
						document.getElementById("urbanCodeRec").disabled = false;
						document.getElementById("paymentDets").disabled = false;
						Toast.fire({
							type: 'error',
							title: `Could not transfer Funds`
						});
					} else {
						CurrentMonitor.transaction(function (fund) {
							return fund - urbansendAmount;
						}, (error, _committed, snapshot) => {
							if (!error) {
								// Generate a new push ID for the Updating user and receiver
								let currentUserUpdate = db.ref(`users`).child(userSplit[3]).child('fundsLog').push();
								let recUserUpdate = db.ref(`users`).child(userToPay.split('!')[1]).child('fundsLog').push();
								let currentUserPushKey = currentUserUpdate.key;
								let recUserPushKey = recUserUpdate.key;
								// Create the data we want to update
								let updatedUserData = {};
								updatedUserData[userSplit[3] + '/fundsLog/' + currentUserPushKey] = {
									"amount": urbansendAmount,
									"channel": "urbanfrisson",
									"currency": "NGN",
									"transaction_type": "debit",
									"customer_transaction_dets": {
										"email": userSplit[1],
										"first_name": userSplit[0].split(' ')[0],
										"id": userSplit[3],
										"risk_action": "default"
									},
									"transaction_date": moment().format(),
									"transaction_id": currentUserPushKey,
									"transaction_ref": currentUserPushKey
								};
								updatedUserData[userToPay.split('!')[1] + '/fundsLog/' + recUserPushKey] = {
									"amount": urbansendAmount,
									"channel": "urbanfrisson",
									"currency": "NGN",
									"transaction_type": "credit",
									"customer_transaction_dets": {
										"email": userToPay.split('!')[2],
										"first_name": userToPay.split('!')[3].split(' ')[0],
										"id": 7524263,
										"risk_action": "default"
									},
									"transaction_date": moment().format(),
									"transaction_id": recUserPushKey,
									"transaction_ref": recUserPushKey
								};
								// Do a deep-path update								
								usersDb.update(updatedUserData, (error) => {
									if (!error) {
										document.getElementById("payAccount").disabled = false;
										document.getElementById('payAccount').innerHTML = 'PAY FROM WALLET'
										document.getElementById("urbanCodeRec").disabled = false;
										document.getElementById("paymentDets").disabled = false;
										document.getElementById("urbanCodeRec").value = '';
										document.getElementById("paymentDets").value = '';
										document.getElementsByClassName("mfp-close")[0].click();
										Toast.fire({
											type: 'success',
											title: 'Funds Transferred Successfully'
										});
									}
								});
							}
						})
					}
				})
				: Toast.fire({
					type: 'error',
					title: `Insufficient Funds`
				});
		}
	})
})

window.addEventListener('DOMContentLoaded', (_event) => {
	checks = true;
});