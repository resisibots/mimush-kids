'use strict'

require('dotenv').config();

const { google } = require('googleapis')
const scopes = 'https://www.googleapis.com/auth/analytics.readonly'
const jwt = new google.auth.JWT(process.env.CLIENT_EMAIL, null, process.env.PRIVATE_KEY, scopes)
const view_id = 'UA-162876654-1'

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
    '1 - כמה מבקרים היו היום באתר' +
    '2 - כמה מוצרים נמכרו היום באתר\n' +
    '3 – כמה כניסות אורגניות\n' +
    '4 - כמה כניסות דרך הקפיין\n' +
    '5 - אחוז ההמרה של מספר המבקרים שרכשו';

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

  twiml.message(mainMenuMsg);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
  

//  try {
//    if (user.mode === 'single-player') {
//      singlePlayerModeHandler(req, res);
//    } else if (user.mode === 'multi-player') {
//      multiPlayerModeHandler(req, res);
//    } else {
//      const userSession = {
//        phone: req.body.From,
//        mode: 'single-player'
//      };

//      await req.saveUserSession(userSession);
//      res.sendMessage(singlePlayerWelcomeMsg);
//    }
//  } catch (error) {
//    res.sendMessage(serverErrorMsg);
//  }
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
