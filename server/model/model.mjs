import dayjs from 'dayjs';

function Role(id, type){
    this.id = id;
    this.type = type;
}
function User(id, username, email, firstName, lastName, role, allowEmailNotification, telegramUsername, imageUrl){
    this.id = id,
    this.username = username;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.role = role;//obj of type Role
    this.allowEmailNotification = allowEmailNotification;
    this.telegramUsername = telegramUsername;
    this.imageUrl = imageUrl;
}
function Category(id, categoryName){
    this.id = id;
    this.categoryName = categoryName;
}
function Status(id, statusName){
    this.id = id;
    this.statusName = statusName;
}
function Office(id, name, category, employees){
    this.id = id;
    this.name = name;
    this.category = category;//obj of type Category
    this.employees = employees;//array of obj of type User
}
function Image(id, imageUrl, uploadedAt){
    this.id = id;
    this.imageUrl = imageUrl;
    this.uploadedAt = dayjs(uploadedAt);
}
function Channel(id, name){
    this.id = id;
    this.name = name;
}
function Message({id, reportId, sender, receiver, text, channel, sendAt, isRead}) {
    this.id = id;
    this.reportId = reportId;
    this.sender = sender;//obj of type User
    this.receiver = receiver;//obj of type User    
    this.text = text;
    this.channel = channel;
    this.sendAt = dayjs(sendAt);
    this.isRead = isRead;
}
function Report({id, title, description, latitude, longitude, address, userId, user, category, images, office, externalOffice, employee, createdAt, updatedAt, rejectReason, status, anonymous, notifications, unreadNotifications, comments}){
    this.id = id;
    this.title = title;
    this.description = description;
    this.latitude = latitude;
    this.longitude = longitude;
    this.address = address;
    this.userId = userId;
    this.user = user;
    this.category = category;//obj of type Category
    this.status = status;//obj of type Status
    this.office = office;//obj of type Office
    this.externalOffice = externalOffice;//obj of type Office
    this.employee = employee;//obj of type User
    this.createdAt = dayjs(createdAt);
    this.updatedAt = dayjs(updatedAt);
    this.rejectReason = rejectReason;
    this.images = images || [];
    this.anonymous = anonymous;
    this.notifications = notifications;//array of obj of type Message
    this.unreadNotifications = unreadNotifications;
    this.comments = comments;//array of obj of type Comment
}

function Comment(id, reportId, user, text, createdAt){
    this.id = id;
    this.reportId = reportId;
    this.user = user;//obj of type User
    this.text = text;
    this.createdAt = dayjs(createdAt);
}

export {User, Report, Message, Office, Role, Status, Image, Category, Channel, Comment};