import axios from "axios";

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
    return data;

  } catch (error) {
    console.error('Error verifying password:', error);
    throw error;
  }
}

const callProtected = async (path, { method = 'GET', body = null, token = null, headers = {} } = {}) => {
  const finalHeaders = { ...headers };
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (!isFormData && body !== null && !finalHeaders['Content-Type']) {
    finalHeaders['Content-Type'] = 'application/json';
  }

  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers: finalHeaders,
    body: (() => {
      if (body === null) 
        return undefined;
      if (isFormData) 
        return body;
      return JSON.stringify(body);
    })()
  };

  const res = await fetch(`${BASE_URL}${path}`, fetchOptions);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed ${res.status} ${res.statusText} - ${text}`);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
};

//Ex. to use the callProtected function to access routes protected by isLogged:

/* 
  GET:

  const session = getSession(chatId);
  if (!session?.token) { sendAuthRequiredMessage(chatId); return; }

  try {
    const reports = await BOT_API.callProtected('/reports', { 
      method: 'GET', 
      token: session.token 
    });
    ...
  } catch (err) {
    bot.sendMessage(chatId, `Errore: ${err.message}`);
  }

*/

/*
  POST:

  const session = getSession(chatId);
  if (!session?.token) { sendAuthRequiredMessage(chatId); return; }

  try {
    const result = await BOT_API.callProtected('/comments/read', {
      method: 'POST',
      body: { ... },
      token: session.token
    });
    ...
  } catch (err) {
    bot.sendMessage(chatId, `Errore: ${err.message}`);
  }

*/

const coordinatesToAddress = async (latitude, longitude) => {
  return new Promise((resolve, reject) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;

    fetch(url)
      .then(response => response.json())
      .then(data => {
        const address = data?.address;
        if (!address) {
          return reject(Object.assign(new Error('Invalid response from geocoding API'), { status: 500 }));
        }

        const formattedAddress = `${address.road || ''} (${address.house_number || ''}), ${address.postcode || ''} ${address.town || address.city || ''}`;

        // Filtro città
        const filters = ['torino', 'turin'];
        const cityName = (address.city || address.town || '').toLowerCase();

        if (!filters.includes(cityName)) {
          return reject(Object.assign(new Error('City not allowed'), { status: 409 }));
        }

        resolve(formattedAddress);
      })
      .catch(error => {
        console.error('Error fetching address:', error);
        reject(Object.assign(new Error('Error fetching address'), { status: 500 }));
      });
  });
};


const getImageBuffer = async imageUrl => {
  return new Promise((resolve, reject) => {
    axios.get(imageUrl, { responseType: 'arraybuffer' }).then(res => {
      resolve(Buffer.from(res.data));
    }).catch(error => {
      reject(error);
    });
  });
}

const BOT_API = {
    callProtected,
    verifyTelegramUsername,
    verifyPassword,
    coordinatesToAddress,
    getImageBuffer
}
export default BOT_API
