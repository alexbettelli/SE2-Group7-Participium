const SERVER_URL = 'http://localhost:3001';

const submitNotification = async (notificationData) => {
  const res = await fetch(SERVER_URL + '/notifications', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(notificationData)
  });

  if (res.ok) {
    return await res.json();
  } else {
    const errDetails = await res.json();
    throw new Error(errDetails.message || 'Error submitting notification');
  }
};

const setReadNotifications = async (reportId) => {
    const res = await fetch(SERVER_URL + '/notifications/read', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({reportId})
    });
    if (res.ok) {
        const data = await res.json();
        return data.readNotifications;
    } else {
        const errDetails = await res.json();
        throw new Error(errDetails.error || 'Error setting notifications as read');
    }
};

export { 
  submitNotification, 
  setReadNotifications 
};