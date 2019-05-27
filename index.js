//Firestore imports
const cron = require('node-schedule');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const SENDGRID_API_KEY = functions.config().sendgrid.key;

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(SENDGRID_API_KEY);

var data = admin.firestore()

//sends an email for each new notification added to a users notification document
exports.newNoti = functions.firestore
  .document('/users/{userID}/notifications/{notificationID}')
  .onCreate( (context, event) => {
    const notificationID = event.params.notificationID;
    const user = event.params.userID;
    const fsdb = admin.firestore();
    return fsdb.collection('notifications')
      .doc(notificationID)
      .get()
      .then(doc => {
        const noti= doc.data()
        const msg = {
          to: user.email,
          from: 'noreply@insider.works',
          subject: noti.message,
          //custom template
          templateID: 'd-faf87202a4a64712933c5beb20c4021d',
          substitionWrappers: ['{{', '}}'],
          substitutions: {
            name: user.name,
            message: noti.message
          }
        };
        return sgMail.send(msg);
      })
      .then(() => console.log('Email sent!'))
      .catch(err => console.log('Error: ', err))
  });

//final daily solution with included ticker field
exports.daily = functions.pubsub.schedule('5 11 * * *').onRun((event, context) => {
  db.collection('/users/{userID}/notifications/{notificationID}')
    .where('read', '==', 'false').where('ticker', '==', 'daily')
    .get()  
    .then(function(querySnapshot) {
        querySnapshot.forEach(function(documentSnapshot) {
          var data = documentSnapshot.data()
          var userID = event.params.userID
          var db = admin.firestore()
          var e = userID.email;
          const msg = {
            to: e,
            from: 'noreply@insider.works',
            subject: data.message,
            //custom template
            templateID: 'd-faf87202a4a64712933c5beb20c4021d',
            substitionWrappers: ['{{', '}}'],
            substitutions: {
            name: userID.name,
            message: noti.message
          }
          };
          return sgMail.send(msg);
        })
    }
    .catch(function(error) {
      console.log('Error sending daily email: ', error)
    }));
  });
//final weekly solution with included ticker field
exports.weekly = functions.pubsub.schedule('* * * * 1').onRun((event, context) => {
  db.collection('/users/{userID}/notifications/{notificationID}')
    .where('read', '==', 'false').where('ticker', '==', 'daily')
    .get()  
    .then(function(querySnapshot) {
        querySnapshot.forEach(function(documentSnapshot) {
          var data = documentSnapshot.data()
          var userID = event.params.userID
          var db = admin.firestore()
          var e = userID.email;
          const msg = {
            to: e,
            from: '//noreply@insider.works',
            subject: data.message,
            //custom template
            templateID: 'd-faf87202a4a64712933c5beb20c4021d',
            substitionWrappers: ['{{', '}}'],
            substitutions: {
            name: userID.name,
            message: noti.message
          }
          };
          return sgMail.send(msg);
        })
    }
    .catch(function(error) {
      console.log('Error sending daily email: ', error)
    }));
  });