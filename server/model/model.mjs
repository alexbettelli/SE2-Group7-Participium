function User(id, username, email, firstName, lastName, typeId, allowEmailNotification, telegramUsername, imageUrl){
    this.id = id,
    this.username = username;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.typeId = typeId;
    this.allowEmailNotification = allowEmailNotification;
    this.telegramUsername = telegramUsername;
    this.imageUrl = imageUrl;
}

function Report({title, description, latitude, longitude, address, userId, catId, images, id, officeId, createdAt, updatedAt, rejectReason, statusId, anonymous, unreadNotifications}){
    this.id = id;
    this.title = title;
    this.description = description;
    this.latitude = latitude;
    this.longitude = longitude;
    this.address = address;
    this.userId = userId;
    this.catId = catId;
    this.statusId = statusId;
    this.officeId = officeId;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.rejectReason = rejectReason;
    this.images = images;
    this.anonymous = anonymous;
    this.unreadNotifications = unreadNotifications;
}

export {User, Report}