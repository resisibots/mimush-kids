'use strict'

require('dotenv').config();

var _ = require('lodash');

const { google } = require('googleapis')
const scopes = 'https://www.googleapis.com/auth/analytics.readonly'
const CLIENT_EMAIL = _.replace(process.env.CLIENT_EMAIL, /\\n/g, '\n');
const jwt = new google.auth.JWT(CLIENT_EMAIL, null, process.env.PRIVATE_KEY, scopes)
const defaults = {
  'auth': jwt,
  'ids': 'ga:' + process.env.VIEW_ID,
}

const twilio = require('twilio');
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const MessagingResponse = twilio.twiml.MessagingResponse;

const express = require('express');
const session = require('cookie-session');

const {
  sendMessage,
  saveUserSession,
  broadcastMessage,
  sessionConfig
} = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

const mainMenuMsg = (() => {
  let message =
    'אהלן כריש 😊\n' +
    "לחץ על המספר המבוקש:\n" +
    '1 - כמה מבקרים היו היום באתר\n' +
    '2 - מה ההכנסה היומית של האתר\n' +
    '3 – כמה כניסות אורגניות\n' +
    '4 - כמה כניסות דרך הקפיין\n' +
    '5 - שיעור ההמרה';

  return message;
})();

// Parse incoming Twilio request
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(session(sessionConfig));

// Custom properties attached on each request & response
app.use((req, res, next) => {
  req.user = req.session.user;
  res.sendMessage = sendMessage(res);
  req.saveUserSession = saveUserSession(req);
  req.broadcastMessage = broadcastMessage(req);
  next();
});

// The main endpoint where messages arrive
app.post('/main', async (req, res) => {
  const user = req.session.user || {};
  const twiml = new MessagingResponse();
  const { Body: userMsg } = req.body;

  const response = await jwt.authorize();
  //const result = await google.analytics('v3').data.ga.get({
  //  ...defaults,
  //  'start-date': 'today',
  //  'end-date': 'today',
  //  'metrics': 'ga:sessions'
  //});

  // TODO switch case, mainMenuMsg as default
  //twiml.message(result.data.rows[0][0]);
  twiml.message(mainMenuMsg + '\n\n' + userMsg);

  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
