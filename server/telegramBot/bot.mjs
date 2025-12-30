import TelegramBot from 'node-telegram-bot-api';
import { Blob } from 'fetch-blob';
import BOT_API from './API.mjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8542311077:AAHdhD6LwBjjj2XW8sIc00ltb7wLQ7MBLB8';
const PASSWORD_ERRORS_LIMIT = 3;
const SESSION_EXPIRED_TIME = 15 * 60 * 1000;
const CLEAN_INTERVAL = 10 * 60 * 1000;

// Session states
const STATE = {
  IDLE: 'idle',
  LOGIN_WAIT_TEL_USERNAME: 'login_waiting_telegram_username',
  LOGIN_WAIT_PASSWORD: 'login_waiting_password',
  REPORT_CREATION_WAIT_TITLE: 'report_creation_waiting_title',
  REPORT_CREATION_WAIT_DESCRIPTION: 'report_creation_waiting_description',
  REPORT_CREATION_WAIT_PHOTO: 'report_creation_waiting_photo',
  REPORT_CREATION_WAIT_LOCATION: 'report_creation_waiting_location',
  REPORT_CREATION_WAIT_CATEGORY: 'report_creation_waiting_category',
  REPORT_CREATION_WAIT_ANONYMOUS: 'report_creation_waiting_anonymous_choice',
};

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const userSessions = new Map();

// ========== Sessions management ==========
const getSession = (chatId) => {
  return userSessions.get(chatId);
};

const deleteSession = (chatId) => {
  userSessions.delete(chatId);
};

const isAuthenticated = (chatId) => {
  const session = userSessions.get(chatId);
  return session && session.authenticated;
};

const sendAuthRequiredMessage = (chatId) => {
  bot.sendMessage(
    chatId,
    `⚠️ *You need to be authenticated to perform this command*.\n\nUse /login to login.`,
    { parse_mode: 'Markdown' }
  );
};


// ========== Login Handlers  ==========
async function handleTelegramUsernameInput(chatId, text) {
  const session = getSession(chatId);
  
  if (Date.now() - session.startedAt > SESSION_EXPIRED_TIME) {
    deleteSession(chatId);
    bot.sendMessage(chatId, '⏱️ Session expired. Use /login and retry.');
    return;
  }
  
  let telegramUsername = text.trim();
  if (telegramUsername.length === 0) {
    bot.sendMessage(chatId, '⚠️ Username incorrect. Retry.');
    return;
  }
  if (!telegramUsername.startsWith('@')) {
    telegramUsername = '@' + telegramUsername;
  }
  
  try {
    const username = await BOT_API.verifyTelegramUsername(telegramUsername);    
    if (!username) {
      deleteSession(chatId);
      bot.sendMessage(
        chatId,
        `❌ *Login failed*\n\n` +
        `No Participium account was found with the Telegram username ${telegramUsername}\n\n` +
        `Please make sure to:\n` +
        `1. Have registered an account on Participium\n` +
        `2. Have set ${telegramUsername} in your profile\n\n` +
        `Use /login to try again.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
    
    session.telegramUsername = telegramUsername;
    session.username = username;
    session.state = STATE.LOGIN_WAIT_PASSWORD;
    session.passwordErrors = 0;
    
    bot.sendMessage(
      chatId,
      `📱 Username received: *${telegramUsername}*\n\n` +
      `Now insert your *Participium password*.\n\n` +
      `⚠️ The message will be deleted after validation!`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error during telegramUsername verification:', error);
    deleteSession(chatId);
    bot.sendMessage(
      chatId,
      `❌ Error during telegramUsername verification.\n\n` +
      `Use /login and try again.`
    );
  }
}
async function handlePasswordInput(chatId, text, messageId) {
  const session = getSession(chatId);

  try {
    await bot.deleteMessage(chatId, messageId);
  } catch (err) {
    console.error('Cannot delete message:', err);
  }
  
  if (Date.now() - session.startedAt > SESSION_EXPIRED_TIME) {
    deleteSession(chatId);
    bot.sendMessage(chatId, '⏱️ Session expired. Use /login and retry.');
    return;
  }
  
  const password = text;
  
  bot.sendMessage(chatId, '🔄 Credential verification in progress...');
  
  try {
    const result = await BOT_API.verifyPassword(session.username, password);

    if (!result || !result.valid) {
      session.passwordErrors = session.passwordErrors + 1;

      if (session.passwordErrors < PASSWORD_ERRORS_LIMIT) {
        bot.sendMessage(
          chatId,
          `❌ *Login failed*\n\n` +
          `Incorrect password for account ${session.telegramUsername}\n\n` +
          `You have *${PASSWORD_ERRORS_LIMIT - session.passwordErrors}* attempts left`,
          { parse_mode: 'Markdown' }
        );
        return;
      } else {
        deleteSession(chatId);
        bot.sendMessage(
          chatId,
          `❌ *Login failed*\n\n` +
          `Incorrect password for account ${session.telegramUsername}\n\n` +
          `You have reached the attempts limit\n` +
          `Use /login to try again.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
    }

    // Login riuscito
    session.authenticated = true;
    session.user = result.user || result; // fallback
    session.token = result.token || null;
    session.state = STATE.IDLE;
    delete session.startedAt;
    delete session.passwordErrors;
    delete session.username;
    delete session.telegramUsername;
    delete session.userInfo;

    bot.sendMessage(
      chatId,
      `✅ *Login successful!*\n\n` +
      `Welcome, ${session.user.username}!\n\n` +
      `Use /logout to disconnect.`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Error during password verification:', err);
    deleteSession(chatId);
    bot.sendMessage(
      chatId,
      `❌ Error during password verification.\n\n` +
      `Use /login and try again.`
    );
  }
}

const showReportMessage = (chatId, categories = undefined) => {
  const session = getSession(chatId);
  session.reportState = (session.reportState || 0) + 1;
  const text = [
    "Provide the *location* of the issue by sending it on the map.\n\n",
    "Provide the *title* of the report.\n\n",
    "Provide the *description* of the report.\n\n",
    "Select the *category* of the report.\n\n",
    "Choose whether to submit the report *anonymously* or not.\n\n",
    "Provide from one to three *photos* for the report\n\n"
  ];

  bot.sendMessage(
    chatId,
    `🆕 *New Report Creation*\n` +
    (session.reportState > 1 ? `\n*Address*: ${session.reportData.location.address}\n` : '') +
    (session.reportState > 2 ? `*Title*: ${session.reportData.title}\n` : '') +
    (session.reportState > 3 ? `*Description*: ${session.reportData.description}\n` : '') +
    (session.reportState > 4 ? `*Category*: ${session.reportData.category.name}\n` : '') +
    (session.reportState > 5 ? `*Anonymous*: ${session.reportData.anonymous ? 'Yes' : 'No'}\n` : '') +
    `\n**Step *${session.reportState}*/6**\n` +
    `${text[session.reportState - 1]}` +
    `You can use /cancel to abort the operation.`,
    { 
      reply_markup: session.reportState === 5 ? {
        inline_keyboard: [
          [
            { text: 'Anonymous', callback_data: "true" },
            { text: 'Not Anonymous', callback_data: "false" }
          ]
        ]
      } : (categories ? {
        inline_keyboard: categories.map(category => ([{ text: category.categoryName, callback_data: category.id }]))
      } : undefined),
      parse_mode: 'Markdown' 
    }
  );
}

function handleReportTitleInput(chatId, text) {
  const session = getSession(chatId);

  if(text.trim().length === 0) {
    bot.sendMessage(chatId, '⚠️ Title cannot be empty. Please provide a valid title.');
    return;
  }

  session.state = STATE.REPORT_CREATION_WAIT_DESCRIPTION;
  session.reportData.title = text.trim();

  showReportMessage(chatId);
}

async function handleReportDescriptionInput(chatId, text) {
  const session = getSession(chatId);
  
  if(text.trim().length === 0) {
    bot.sendMessage(chatId, '⚠️ Description cannot be empty. Please provide a valid description.');
    return;
  }
  
  session.state = STATE.REPORT_CREATION_WAIT_CATEGORY;
  session.reportData.description = text.trim();

  try {
    const categories = await BOT_API.callProtected('/categories', { method: 'GET', token: session.token });
    showReportMessage(chatId, categories);
  } catch {
    bot.sendMessage(chatId, '❌ Error retrieving categories. Please try again later.');
    return;
  }
}

bot.on('location', (msg) => {
  const chatId = msg.chat.id;
  const session = getSession(chatId);

  if(!session || session.state !== STATE.REPORT_CREATION_WAIT_LOCATION) {
    bot.sendMessage(chatId, '⚠️ No location upload in progress.');
    return;
  }

  const location = msg.location;
  console.log(`Received location: lat=${location.latitude}, lon=${location.longitude}`);
  BOT_API.coordinatesToAddress(location.latitude, location.longitude).then(address => {
    if(address) {  
      session.reportData.location = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: address
      };
      console.log(address);
      session.state = STATE.REPORT_CREATION_WAIT_TITLE;
      showReportMessage(chatId);
    } else {
      bot.sendMessage(chatId, '❌ Error retrieving address from location. Please try again.');
    }
  }).catch(err => {
    if(err === 409) {
      bot.sendMessage(chatId, '❌ The selected location is outside Turin. Please send a location within Turin.');
    } else {
      bot.sendMessage(chatId, '❌ Error retrieving address from location. Please try again.');
    }
  });

});

bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const session = getSession(chatId);
  const photos = msg.photo;
  const fileId = photos[photos.length - 1].file_id;

  if(!session || session.state !== STATE.REPORT_CREATION_WAIT_PHOTO) {
    bot.sendMessage(chatId, '⚠️ No photo upload in progress.');
    return;
  }

  if(!session.reportData.photos) session.reportData.photos = [];

  console.log(`Received ${photos.length}, actual ${session.reportData.photos.length}`);
  if(session.reportData.photos.length >= 3) {
    bot.sendMessage(chatId, '⚠️ You have already uploaded the maximum number of photos.');
    return;
  }

  try {
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;
    console.log('Photo URL:', fileUrl);
    const buffer = await BOT_API.getImageBuffer(fileUrl);
    session.reportData.photos.push(buffer);
    bot.sendMessage(
      chatId, 
      `✅ Photo received! You have uploaded ${session.reportData.photos.length} photo(s).` +
      (session.reportData.photos.length < 3 ? `\nYou can send ${3 - session.reportData.photos.length} more photo(s)` : ``) +
      `\n\nUse /done to create the report` +
      `\nUse /cancel to abort the operation.`
    );
  } catch(error) {
    console.error('Error getting photo file URL:', error);
    bot.sendMessage(chatId, '❌ Error processing the photo. Please try again.');
    return;
  }
  
});

// ========== Centralized Message Handler ==========
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Ignore default commands (managed by onText) and non-text messages
  if (!text || text.startsWith('/')) return;
  
  const session = getSession(chatId);
  if (!session) return;
  
  // Router based on session states
  switch (session.state) {
    case STATE.LOGIN_WAIT_TEL_USERNAME:
      await handleTelegramUsernameInput(chatId, text);
      break;  
    case STATE.LOGIN_WAIT_PASSWORD:
      await handlePasswordInput(chatId, text, msg.message_id);
      break;
    case STATE.REPORT_CREATION_WAIT_TITLE:
      handleReportTitleInput(chatId, text);
      break; 
    case STATE.REPORT_CREATION_WAIT_DESCRIPTION:
      await handleReportDescriptionInput(chatId, text);
      break;
    default:
      // State unknown or idle - ignore
      break;
  }
});

bot.on('callback_query', callback => {
  const chatId = callback.message.chat.id;
  const session = getSession(chatId);

  if(!session || (session.state !== STATE.REPORT_CREATION_WAIT_CATEGORY && session.state !== STATE.REPORT_CREATION_WAIT_ANONYMOUS)) {
    bot.answerCallbackQuery(callback.id, { text: '⚠️ No selection in progress.' });
    return;
  }


  if(session.state === STATE.REPORT_CREATION_WAIT_CATEGORY) {
    session.reportData.category = {
      id: callback.data,
      name: callback.message.reply_markup.inline_keyboard[callback.data][0].text
    };
    console.log('Selected category:', session.reportData.category);
    session.state = STATE.REPORT_CREATION_WAIT_ANONYMOUS;
  } else {
    session.reportData.anonymous = callback.data === "true";
    session.state = STATE.REPORT_CREATION_WAIT_PHOTO;
  }

  bot.answerCallbackQuery(callback.id);
  showReportMessage(chatId);
});

// ========== Commands ==========
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(
    chatId,
    `I am the official bot of Group 7 Participium App, a platform for reporting and managing urban issues of the Municipality of Turin.\n\n` +    
    `Use the /login command to connect your Participium account and get started!`
  );
});

bot.onText(/\/contact/, (msg) => {
  const chatId = msg.chat.id;

  const text =
    `📞 *Participium contacts*\n\n` +
    `✉️ *Email*: participium.g7@gmail.com\n` +
    `☎️ *Phone*: N/A\n\n` +
    `🌐 *Website (local)*: http://localhost:5173\n` +
    `🌐 *Project repo*: https://github.com/alexbettelli/SE2-Group7-Participium\n`;

  bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });
});

bot.onText(/\/login/, (msg) => {
  const chatId = msg.chat.id;
  
  const session = getSession(chatId);
  if (session && session.authenticated) {
    bot.sendMessage(
      chatId,
      `ℹ️ You are already authenticaterd as *${session.user.username}*.\n\n` +
      `Use /logout to disconnect.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  userSessions.set(chatId, {
    state: STATE.LOGIN_WAIT_TEL_USERNAME,
    startedAt: Date.now(),
    authenticated: false
  });
  
  bot.sendMessage(
    chatId,
    `🔐 *Login Procedure*\n\n` +
    `Insert your *Telegram username* registered on Participium web site.\n\n` +
    `Format: @username or username\n\n` +
    `Use /cancel to stop in progress operations.`,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/\/logout/, (msg) => {
  const chatId = msg.chat.id;
  const session = getSession(chatId);
  
  if (!session || !session.authenticated) {
    bot.sendMessage(chatId, 'ℹ️ ERROR! You are not authenticated');
    return;
  }
  
  const username = session.user.username;
  deleteSession(chatId);
  
  bot.sendMessage(
    chatId,
    `👋 Logout successful!\n\n` +
    `Goodbye, ${username}.\n\n` +
    `Use /login to login again.`
  );
});

bot.onText(/\/cancel/, (msg) => {
  const chatId = msg.chat.id;
  const session = getSession(chatId);
  
  if (!session || session.state === STATE.IDLE) {
    bot.sendMessage(chatId, 'ℹ️ No operations in progress.');
    return;
  }
  
  deleteSession(chatId);
  bot.sendMessage(chatId, '✅ Operation cancelled successfully.');
});

bot.onText(/\/newreport/, async msg => {
  const chatId = msg.chat.id;
  const session = getSession(chatId);

  if (!isAuthenticated(chatId)) {
    sendAuthRequiredMessage(chatId);
    return;
  }

  session.state = STATE.REPORT_CREATION_WAIT_LOCATION; 
  session.reportStep = 0;
  session.reportData = {};

  showReportMessage(chatId);
});

bot.onText(/\/done/, async msg => {
  const chatId = msg.chat.id;
  const session = getSession(chatId);

  if(!isAuthenticated(chatId)) {
    sendAuthRequiredMessage(chatId);
    return;
  }

  if(session.state !== STATE.REPORT_CREATION_WAIT_PHOTO || !session.reportData.photos || session.reportData.photos.length > 3) {
    bot.sendMessage(chatId, 'There is not a report creation in progress or not enough photos uploaded (minimum 1, maximum 3).');
    return;
  }

  const form = new FormData();
  form.append('title', session.reportData.title);
  form.append('description', session.reportData.description);
  form.append('latitude', session.reportData.location.latitude);
  form.append('longitude', session.reportData.location.longitude);
  form.append('address', session.reportData.location.address);
  form.append('catId', session.reportData.category.id);
  form.append('anonymous', session.reportData.anonymous ? 'true' : 'false');

  for (let i = 0; i < session.reportData.photos.length; i++) {
    const photo = session.reportData.photos[i];
    form.append('images', new Blob([photo], { type: 'image/jpg' }), `photo${i + 1}.jpg`);
  }

  BOT_API.callProtected('/users/reports', { method: 'POST', body: form, token: session.token }).then(response => {
    bot.sendMessage(chatId, '✅ Report created successfully!');
    session.state = STATE.IDLE;
    delete session.reportData;
    delete session.reportStep;
    delete session.reportState;
  }).catch(err => {
    console.error('Error creating report:', err);
    bot.sendMessage(chatId, '❌ Error creating the report. Please try again later.');
  });
});

// Fetch report status   /reportstatus <id>
bot.onText(/^\/reportstatus(?:@[\w_]+)? (\d+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const session = getSession(chatId);

  if (!session || !session.authenticated || !session.token) {
    sendAuthRequiredMessage(chatId);
    return;
  }

  const reportId = match[1];

  try {
    const report = await BOT_API.callProtected(`/reports/${reportId}`, {
      method: 'GET',
      token: session.token
    });

    if (!report.user || report.user.id !== session.user.id) {
      bot.sendMessage(chatId, "❌ You are not authorized to view this report or it doesn't exist.");
      return;
    }

    let text = `📝 *Report #${report.id}*\n`;
    text += `📌 *Title:* ${report.title}\n`;
    text += `📊 *Status:* ${report.status?.statusName || report.status || 'N/A'}\n`;
    text += `🏷️ *Category:* ${report.category?.categoryName || report.category || 'N/A'}\n`;
    text += `📍 *Address:* ${report.address || 'N/A'}\n`;
    text += `🗓️ *Created at:* ${report.createdAt ? new Date(report.createdAt).toLocaleString('it-IT') : 'N/A'}\n`;
    text += `📝 *Description:*\n${report.description || 'N/A'}`;

    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

    for (const img of report.images) {
      if (img.imageUrl) {
        const fileName = path.basename(img.imageUrl);
        const localPath = path.join(
          __dirname, '..', '..', 'server', 'uploads', 'reports', String(report.id), fileName
        );
        if (fs.existsSync(localPath)) {
          await bot.sendPhoto(chatId, fs.createReadStream(localPath));
        } else {
          await bot.sendMessage(chatId, "⚠️ Image not found on the server.");
        }
      }
    }
  } catch (err) {
    console.error('Error fetching report:', err);
    bot.sendMessage(chatId, "❌ Error: Unable to fetch report. Make sure the ID is correct and you are logged in.");
  }
});

// ========== Clean Up ==========
setInterval(() => {
  const now = Date.now();
  for (const [chatId, session] of userSessions.entries()) {
    if (!session.authenticated && session.startedAt && now - session.startedAt > SESSION_EXPIRED_TIME) {
      deleteSession(chatId);
    }
  }
}, CLEAN_INTERVAL);

console.log('✅ Telegram Bot started successfully');

export default bot;