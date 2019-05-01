const firebase = require('firebase');
const config = require('./config');
// Initialize Firebase app.
firebase.initializeApp(config);
const db = firebase.database();
const usersDb = db.ref('users');

new Vue({
  el: '#app',
  data() {
    return {
      search: '',
      usersCount: 0,
      headers: [
        {
          text: 'Avatar',
          align: 'left',
          sortable: false,
          value: 'photoURL'
        },
        {
          text: 'Name',
          align: 'left',
          sortable: false,
          value: 'displayName'
        },
        { text: 'Email', value: 'email' },
        { text: 'Funds', value: 'AccountFunds' },
        { text: 'User type', value: 'user_type' },
        { text: 'UsrbanFrisson Code', value: 'urbanCode' }
      ],
      dets: []
    };

  },
  created(){
    usersDb.on('value', (snapshot) => {
      let usersArray = [];
      let users = 0;
      snapshot.forEach(function (childSnapshot) {
        users += 1;
        const lobj = childSnapshot.val()
        lobj.id = childSnapshot.key
        usersArray.push(lobj)
      })
      this.dets = usersArray;
      this.usersCount = users;
      console.log(this.dets)
    })
  }
});