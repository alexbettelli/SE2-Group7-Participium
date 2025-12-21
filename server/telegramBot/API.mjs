const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

const verifyTelegramUsername = async(telegramUsername) => {
    try {
      const response = await fetch(`${BASE_URL}/bot/verify/username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramUsername })
      });
      const res = await response.json()
      return res.username;
    } catch (error) {
      console.error('Error verifying telegram username:', error);
      throw error;
    }
}

const verifyPassword = async(username, password) => {
  try {
    const response = await fetch(`${BASE_URL}/bot/verify/password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    return data.valid ? data.user : false;

  } catch (error) {
    console.error('Error verifying password:', error);
    throw error;
  }
}

const BOT_API = {
    verifyTelegramUsername,
    verifyPassword
}
export default BOT_API