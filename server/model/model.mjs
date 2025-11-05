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


export {User}