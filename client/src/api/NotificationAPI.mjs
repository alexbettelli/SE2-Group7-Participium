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
    body: JSON.stringify({ reportId })
  });
  if (res.ok) {
    const data = await res.json();
    return data.readNotifications;
  } else {
    const errDetails = await res.json();
    throw new Error(errDetails.error || 'Error setting notifications as read');
  }
};


const submitComment = async (commentData) => {
  const res = await fetch(SERVER_URL + '/comments', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commentData)
  });

  if (res.ok) {
    return await res.json();
  } else {
    const errDetails = await res.json();
    throw new Error(errDetails.message || 'Error submitting comment');
  }
};

const setReadComments = async (reportId) => {
  const res = await fetch(SERVER_URL + '/comments/read', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ reportId })
  });
  if (res.ok) {
    const data = await res.json();
    return data.readComments;
  } else {
    const errDetails = await res.json();
    throw new Error(errDetails.error || 'Error setting comments as read');
  }
};

const NotificationAPI = {
  submitNotification,
  setReadNotifications,
  submitComment,
  setReadComments,
};

export default NotificationAPI