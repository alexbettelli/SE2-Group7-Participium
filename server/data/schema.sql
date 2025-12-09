CREATE TABLE IF NOT EXISTS user_type (
  id INTEGER PRIMARY KEY,
  type TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS user (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  typeId INTEGER NOT NULL,
  allowEmailNotification INTEGER DEFAULT 1,
  telegramUsername TEXT,
  imageUrl TEXT,
  FOREIGN KEY (typeId) REFERENCES user_type(id)
);
CREATE TABLE IF NOT EXISTS external_office (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  catId INTEGER NOT NULL,
  FOREIGN KEY (catId) REFERENCES report_category(id)
);
CREATE TABLE IF NOT EXISTS external_office_employee (
  external_officeId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  PRIMARY KEY (external_officeId, userId),
  FOREIGN KEY (external_officeId) REFERENCES external_office(id),
  FOREIGN KEY (userId) REFERENCES user(id)
);
CREATE TABLE IF NOT EXISTS report_category (
  id INTEGER PRIMARY KEY,
  categoryName TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS report_status (
  id INTEGER PRIMARY KEY,
  statusName TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS office (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  catId INTEGER NOT NULL,
  FOREIGN KEY (catId) REFERENCES report_category(id)
);
CREATE TABLE IF NOT EXISTS office_employee (
  officeId INTEGER NOT NULL,
  userId INTEGER NOT NULL,
  PRIMARY KEY (officeId, userId),
  FOREIGN KEY (officeId) REFERENCES office(id),
  FOREIGN KEY (userId) REFERENCES user(id)
);
CREATE TABLE IF NOT EXISTS report (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT,
  userId INTEGER NOT NULL,
  anonymous INTEGER DEFAULT 0,
  catId INTEGER NOT NULL,
  statusId INTEGER NOT NULL,
  officeId INTEGER,
  externalOfficeId INTEGER,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  rejectReason TEXT,
  employeeId INTEGER,
  externalMaintainerId INTEGER,
  FOREIGN KEY (userId) REFERENCES user(id),
  FOREIGN KEY (catId) REFERENCES report_category(id),
  FOREIGN KEY (statusId) REFERENCES report_status(id),
  FOREIGN KEY (officeId) REFERENCES office(id),
  FOREIGN KEY (externalOfficeId) REFERENCES external_office(id)
);
CREATE TABLE IF NOT EXISTS report_image (
  id INTEGER PRIMARY KEY,
  reportId INTEGER NOT NULL,
  imageUrl TEXT NOT NULL,
  uploadedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reportId) REFERENCES report(id)
);
CREATE TABLE IF NOT EXISTS channel (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS comment (
  id INTEGER PRIMARY KEY,
  reportId INTEGER NOT NULL,
  senderId INTEGER NULL,
  text TEXT NOT NULL,
  sendAt TEXT DEFAULT CURRENT_TIMESTAMP,
  receiverId INTEGER,
  isRead INTEGER DEFAULT 0,
  FOREIGN KEY (reportId) REFERENCES report(id),
  FOREIGN KEY (senderId) REFERENCES user(id),
  FOREIGN KEY (receiverId) REFERENCES user(id)
);
CREATE TABLE IF NOT EXISTS notification (
  id INTEGER PRIMARY KEY,
  reportId INTEGER,
  senderId INTEGER NULL,
  receiverId INTEGER NOT NULL,
  text TEXT NOT NULL,
  channelId INTEGER NOT NULL,
  sendAt TEXT DEFAULT CURRENT_TIMESTAMP,
  isRead INTEGER DEFAULT 0,
  FOREIGN KEY (reportId) REFERENCES report(id),
  FOREIGN KEY (senderId) REFERENCES user(id),
  FOREIGN KEY (receiverId) REFERENCES user(id),
  FOREIGN KEY (channelId) REFERENCES channel(id)
);