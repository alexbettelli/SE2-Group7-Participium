import {User, Report, Message, Office, Role, Status, Image, Category, Channel}from '../model/model.mjs';

//map a single user
function mapRowToUser(row) {
    if (!row) return null;

    const role = new Role(
        row.typeId,
        row.type
    )   

    return new User(
        row.id,
        row.username,
        row.email,
        row.firstName,
        row.lastName,
        role,                    
        row.allowEmailNotification,
        row.telegramUsername,
        row.imageUrl
    );
}
//map multiple users
const mapRowsToUsers = (rows) => {
    return rows.map(mapRowToUser);
}

//map a single office
const mapRowToOffice = (rows) => {
    return mapRowsToOffices(rows)[0];
}
//map multiple office
const mapRowsToOffices = (rows) => {
    const grouped = rows.reduce((acc, row) => {
        if (!acc[row.id]) {
            acc[row.id] = new Office(
                row.id,
                row.name,
                new Category(row.catId, row.categoryName),
                []
            );
        }

        if (row.employeeId) {
            acc[row.id].employees.push(new User(row.employeeId, row.username));
        }

        return acc;
    }, {});

    return Object.values(grouped);
}

//map a single role
const mapRowToRole = (row) =>{
    if (!row) return null;     

    return new Role(
        row.id,
        row.type
    );
}
//map multiple roles
const mapRowsToRoles = (rows) => {
    return rows.map(mapRowToRole);
}

//map a single category
const mapRowToCategory = (row) =>{
    if (!row) return null;     

    return new Category(
        row.id,
        row.categoryName
    );
}
//map multiple categories
const mapRowsToCategories = (rows) => {
    return rows.map(mapRowToCategory);
}

//map a single status
const mapRowToStatus = (row) =>{
    if (!row) return null;     

    return new Status(
        row.id,
        row.statusName
    );
}
//map multiple status
const mapRowsToStatus = (rows) => {
     return rows.map(mapRowToStatus);
}
 
//map multiple reports
const mapRowsToReports = (rows) => {
    const grouped = rows.reduce((acc, row) => {
        if (!acc[row.id]) {
            acc[row.id] = {
                id: row.id,
                title: row.title,
                description: row.description,
                latitude: row.latitude,
                longitude: row.longitude,
                address: row.address,
                user: new User(row.userId, row.username),
                employee: row.employeeId ? new User(row.employeeId, row.employeeUsername) : null,
                category: new Category(row.catId, row.categoryName),
                status: new Status(row.statusId, row.statusName),
                office: row.officeId ? new Office(row.officeId, row.officeName) : null,
                createdAt: row.createdAt,
                updatedAt: row.updatedAt,
                rejectReason: row.rejectReason,
                anonymous: row.anonymous,
                images: [],
                notifications: [],
                unreadNotifications: row.unreadNotifications || 0
            };
        }

        const report = acc[row.id];

        // add image if it not exist
        if (row.imageId && !report.images.some(img => img.id === row.imageId)) {
            report.images.push(new Image(row.imageId, row.imageUrl));
        }

        // add message if it not exist
        if (row.messageId && !report.messages.some(msg => msg.id === row.messageId)) {
            const message = new Message({
                id: row.messageId,
                reportId: row.id,
                sender: new User(row.senderId, row.senderUsername),
                receiver: new User(row.receiverId, row.receiverUsername),
                text: row.text,
                channel: row.channelId || 1,
                sendAt: row.sendAt,
                isRead: !!row.isRead
            });
            report.notifications.push(message);
        }

        return acc;
    }, {});

    return Object.values(grouped).map(r => new Report({ ...r }));
};

//map single report
const mapRowsToReport = (rows) => {
    return mapRowsToReports(rows)[0];
}

const Mapper = {
    mapRowToUser,
    mapRowsToUsers,
    mapRowToRole,
    mapRowsToRoles,
    mapRowToCategory,
    mapRowsToCategories,
    mapRowToStatus,
    mapRowsToStatus,
    mapRowToOffice, 
    mapRowsToOffices,
    mapRowsToReports,
    mapRowsToReport    
}

export default Mapper;