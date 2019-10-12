/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
const fs = require("fs");

admin.initializeApp();
const db = admin.firestore();
// Configure the email transport using the default SMTP transport and a GMail account.
// For Gmail, enable these:
// 1. https://www.google.com/settings/security/lesssecureapps
// 2. https://accounts.google.com/DisplayUnlockCaptcha
// For other types of transports such as Sendgrid see https://nodemailer.com/transports/
// TODO: Configure the `gmail.email` and `gmail.password` Google Cloud environment variables.
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword
  }
});

// TODO: Change this to your app or company name to customize the email sent.
const APP_NAME = "Insider WORKS";

/**
 * Sends a welcome email to new user.
 */
exports.sendWelcomeEmail = functions.auth.user().onCreate(user => {
  const email = user.email; // The email of the user.
  const displayName = user.displayName; // The display name of the user.
  return sendWelcomeEmail(email, displayName);
});
/**
 * Send an account deleted email confirmation to users who delete their accounts.
 */
exports.sendByeEmail = functions.auth.user().onDelete(user => {
  // [END onDeleteTrigger]
  const email = user.email;
  const displayName = user.displayName;

  return sendGoodbyeEmail(email, displayName);
});

// Sends a welcome email to the given user.
async function sendWelcomeEmail(email, displayName) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: email
  };

  // The user subscribed to the newsletter.
  mailOptions.subject = `Welcome to ${APP_NAME}!`;
  mailOptions.text = `Hey ${displayName ||
    ""}! Welcome to ${APP_NAME}. I hope you will enjoy our service.`;
  await mailTransport.sendMail(mailOptions);
  console.log("New welcome email sent to:", email);
  return null;
}

// Sends a goodbye email to the given user.
async function sendGoodbyeEmail(email, displayName) {
  const mailOptions = {
    from: `${APP_NAME} <noreply@firebase.com>`,
    to: email
  };

  // The user unsubscribed to the newsletter.
  mailOptions.subject = `Bye!`;
  mailOptions.text = `Hey ${displayName ||
    ""}!, We confirm that we have deleted your ${APP_NAME} account.`;
  await mailTransport.sendMail(mailOptions);
  console.log("Account deletion confirmation email sent to:", email);
  return null;
}

exports.userNotiCreate = functions.firestore
  .document("users/{userID}/notifications/{notificationID}")
  .onCreate((change, context) => {
    console.log(context.params.userID);
    console.log(context.params.notificationID);

    const userID = context.params.userID;
    const gen = change.data();
    const message = gen.message;
    //dynamic grab
    const userObj = db
      .collection("users")
      .doc(userID)
      .get()
      .then(function(doc) {
        if (doc.exists) {
          console.log("Document grab .data():", doc.data());
          const docSnap = doc.data();
          const email = docSnap.email;
          const name = docSnap.name;
          console.log(email, name, message);
          return sendNewNoti(email, name, message);
        } else {
          //doc.data() is undefined
          console.log("No such document, rework");
        }
      });
    return null;
  });

exports.projNotiCreate = functions.firestore
  .document("projects/{projectID}/notifications/{notificationID}")
  .onCreate((change, context) => {
    console.log(context.params.projectID);
    console.log(context.params.notificationID);
    var members = [];
    const projectID = context.params.projectID;
    const gen = change.data();
    const message = gen.message;
    //dynamic grab
    const projObj = db
      .collection("projects")
      .doc(projectID)
      .get()
      .then(function(doc) {
        if (doc.exists) {
          //this represents the overall projectID specific document JSON
          const docSnap = doc.data();
          //call to this JSON for field values to compare members against read list
          const membersTemp = docSnap.members;
          membersTemp.forEach(element => {
            members.push(element);
          });
          console.log(members);
          //loops through each member of the project and notifies them of the projNoti
          members.forEach(element => {
            const addition = db
              .collection("users")
              .doc(element)
              .get()
              .then(function(doc) {
                if (doc.exists) {
                  const userSnap = doc.data();
                  const email = userSnap.email;
                  const name = userSnap.name;
                  console.log(email, name);
                  return sendNewNoti(email, name, message);
                } else {
                  console.log("No such element, rework");
                }
              });
          });
        } else {
          console.log("No such document, rework");
        }
      });
    return null;
  });

async function sendNewNoti(email, displayName, message) {
  const mailOptions = {
    from: `insider.works.noreply@gmail.com`,
    to: email
  };

  mailOptions.subject = `New Notification from Insider.WORKS!`;
  mailOptions.text = `Hey ${displayName || ""}, ${message}`;
  await mailTransport.sendMail(mailOptions);
  console.log("Account notification confirmation email sent to:", email);
  return 0;
}

//DOCUMENTATION TO BE ADDED LATER
