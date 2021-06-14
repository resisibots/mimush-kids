require('dotenv').config();
const twilio = require('twilio');
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const MessagingResponse = twilio.twiml.MessagingResponse;

const multiPlayerModeHandler = require('./mode-controllers/multiplayer');
const singlePlayerModeHandler = require('./mode-controllers/singleplayer');

const express = require('express');
const session = require('cookie-session');

const { singlePlayerWelcomeMsg, serverErrorMsg } = require('./messages');
const {
  sendMessage,
  saveUserSession,
  broadcastMessage,
  sessionConfig
} = require('./utils');

const app = express();
const PORT = process.env.PORT || 3000;

const simpleMessage = (() => {
  let message =
    'Welcome to SMS Gaming Singleplayer mode! 🎮\n' +
    "Play a game by typing it's number!\n\n" +
    listOfGames +
    '\nAlternatively, if you are brave enough, switch to multiplayer mode ' +
    'with */m* command and play with others! 😎\n' +
    'You can bring this guide again with */h* command 🆘';

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
  twiml.message(simpleMessage);
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
