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

// Company name to include in the emails
const APP_NAME = "Insider WORKS";

// [START sendWelcomeEmail]
/**
 * Sends a welcome email to new user.
 */
// [START onCreateTrigger]
exports.sendWelcomeEmail = functions.auth.user().onCreate(user => {
  // [END onCreateTrigger]
  // [START eventAttributes]
  const email = user.email; // The email of the user.
  const displayName = user.displayName; // The display name of the user.
  // [END eventAttributes]

  return sendWelcomeEmail(email, displayName);
});
// [END sendWelcomeEmail]

// [START sendByeEmail]
/**
 * Send an account deleted email confirmation to users who delete their accounts.
 */
// [START onDeleteTrigger]
exports.sendByeEmail = functions.auth.user().onDelete(user => {
  // [END onDeleteTrigger]
  const email = user.email;
  const displayName = user.displayName;

  return sendGoodbyeEmail(email, displayName);
});
// [END sendByeEmail]

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
// NOTES

//implement whereEqualTo method to query notifications on "read" == "false"
//send email to this compound group query (issues: you will get an email each time
//you get a new project, and repeated ones for each new project (duplicates over time)
//maybe scale this into two listener methods

//END NOTES

exports.newNoti2 = functions.firestore
  .document("users/{userID}/notifications/{notificationID}")
  .onCreate((change, context) => {
    const userID = context.params.userID;
    const notificationID = context.params.notificationID;
    const message = notificationID.message;
    const receiverID = notificationID.receiverID;
    //method information
    const receiverName = receiverID.name;
    const receiverEmail = receiverID.email;
    const emailMessage = notificationID.message;

    return sendNewNoti(receiverEmail, receiverName, emailMessage);
  });

exports.newNoti3 = functions.firestore
  .document("projects/{projectID}/notifications/{notificationID}")
  .onCreate((change, context) => {
    const userID = context.params.userID;
    const notificationID = context.params.notificationID;
    const message = notificationID.message;
    const receiverID = notificationID.receiverID;
    //method information
    const receiverName = receiverID.name;
    const receiverEmail = receiverID.email;
    const emailMessage = notificationID.message;

    return sendNewNoti(receiverEmail, receiverName, emailMessage);
  });

//trigger condition and routing path
exports.userSend = functions.firestore
  .document("users/{userID}/notifications/{notificationID}")
  .onWrite((change, context) => {
    //grabs dynamic variables inside query structure and injects into the query
    const userID = context.params.userID;
    const notificationID = context.params.notificationID;
    let outerRef = db
      .collection("users")
      .doc(userID)
      .collection("notifications");
    let innerRef = outerRef.where("read", "==", false);

    //returns a query of notification documents that haven't been read
    return innerRef.get().then((change, context) => {
      const receiverID = context.params.receiverID;
      const receiverEmail = receiverID.email;
      const receiverName = receiverID.name;
      const message = notificationID.message;
      return sendNewNoti(receiverEmail, receiverName, message);
    });
  });

exports.projSend = functions.firestore
  .document("projects/{projectID}/notifications/{notificationID}")
  .onWrite((change, context) => {
    const projectID = context.params.projectID;
    const notificationID = context.params.notificationID;
    //same as userSend method with data-specific query triggered on event
    let outerRef = db
      .collection("projects")
      .doc(projectID)
      .collection("notifications");
    let innerRef = outerRef.where("read", "==", false);

    return innerRef.get().then((change, context) => {
      const receiverID = context.params.receiverID;
      const receiverEmail = receiverID.email;
      const receiverName = receiverID.name;
      const message = notificationID.message;
      return sendNewNoti(receiverEmail, receiverName, message);
    })
  });

async function sendNewNoti(email, displayName, message) {
  const mailOptions = {
    from: `insider.works.noreply@gmail.com`,
    to: email
  };

  mailOptions.subject = `New Notification from Insider.WORKS!`;
  mailOptions.text = `Hey ${displayName || ""}!, ${message}`;
  await mailTransport.sendMail(mailOptions);
  console.log("Account notification confirmation email sent to:", email);
  return null;
}