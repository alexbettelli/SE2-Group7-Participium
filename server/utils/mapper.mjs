import { User, Employee, Report, Message, Office, Role, Status, Image, Category, Channel, Comment } from '../model/model.mjs';

const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const IMAGE_BASE_URL = `${BASE_URL}/images`;
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
        row.imageUrl ? `${IMAGE_BASE_URL}/profiles/${row.imageUrl}` : null
    );
}
//map multiple users
const mapRowsToUsers = (rows) => {
    return rows.map(mapRowToUser);
}

const mapRowsToEmployee = (rows) => {
    return mapRowsToEmployees(rows)[0];
}
const mapRowsToEmployees = (rows) => { 

    const grouped = rows.reduce((acc, row) => {
        if (!acc[row.id]) {
            acc[row.id] = {
                id : row.id,
                username : row.username,
                email : row.email,
                firstName : row.firstName,
                lastName : row.lastName,
                role : new Role( row.typeId, row.type ),
                offices : []            
            };
        }

        const employee = acc[row.id];

        // add office if it not exists
        if (row.officeId && !employee.offices.some(office => office.id === row.officeId)) {
            employee.offices.push(new Office(row.officeId, row.officeName));
        }     

        return acc;
    }, {});

    return Object.values(grouped).map(r => new Employee({ ...r }));
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
            acc[row.id].employees.push(new User(row.employeeId, row.username, row.email, row.firstName, row.lastName));
        }

        return acc;
    }, {});

    return Object.values(grouped);
}

//map a single role
const mapRowToRole = (row) => {
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
const mapRowToCategory = (row) => {
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
const mapRowToStatus = (row) => {
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
        acc[row.id] ??= initReport(row);

        const report = acc[row.id];
        addImage(report, row);
        addNotification(report, row);
        addComment(report, row);

        return acc;
    }, {});

    return Object.values(grouped).map(r => new Report({ ...r }));
};

//map single report
const mapRowsToReport = (rows) => {
    return mapRowsToReports(rows)[0];
}

//map a single message 
const mapRowToMessage = (row) => {
    if (!row) return null;
    let channel = null;
    if (row.channelId) {
        channel = new Channel(row.channelId, row.channelName || null);
    } else if (row.channel && typeof row.channel === 'object') {
        channel = new Channel(row.channel.id, row.channel.name);
    }
    let sender = null; //for default notifications
    if (row.senderId) {
        sender = new User(
            row.senderId,
            row.senderUsername,
            row.senderEmail,
            row.senderFirstName,
            row.senderLastName,
            row.senderTypeId ? new Role(row.senderTypeId) : null
        );
    }
    let receiver = null; //maybe if in the future we want to have broadcast messages
    if (row.receiverId) {
        receiver = new User(
            row.receiverId,
            row.receiverUsername,
            row.receiverEmail,
            row.receiverFirstName,
            row.receiverLastName,
            row.receiverTypeId ? new Role(row.receiverTypeId) : null
        );
    }
    return new Message({
        id: row.id,
        reportId: row.reportId,
        sender,
        receiver,
        text: row.text,
        channel,
        sendAt: row.sendAt,
        isRead: !!row.isRead
    });
}
//map multiple messages
const mapRowsToMessage = (rows) => {
    return rows.map(mapRowToMessage);
}
//map a single comment
const mapRowToComment = (row) => {
    if (!row) return null;
    const sender = row.senderId ? new User(row.senderId, row.senderUsername) : null;
    const receiver = row.receiverId ? new User(row.receiverId, row.receiverUsername) : null;
    const id = row.commentId ?? row.id;
    const reportId = row.reportId ?? row.id;
    const text = row.commentText ?? row.text;
    const sendAt = row.commentSendAt ?? row.sendAt;
    const isRead = row.commentIsRead ?? row.isRead;
    return new Comment(
        id,
        reportId,
        sender,
        receiver,
        text,
        sendAt,
        isRead
    );
}
//map multiple comments
const mapRowsToComments = (rows) => {
    return rows.map(mapRowToComment);
}
const Mapper = {
    mapRowToUser,
    mapRowsToUsers,
    mapRowsToEmployee,
    mapRowsToEmployees, 
    mapRowToRole,
    mapRowsToRoles,
    mapRowToCategory,
    mapRowsToCategories,
    mapRowToStatus,
    mapRowsToStatus,
    mapRowToOffice,
    mapRowsToOffices,
    mapRowsToReports,
    mapRowsToReport,
    mapRowToMessage,
    mapRowsToMessage,
    mapRowToComment,
    mapRowsToComments
}

const createUser = (id, username) => id ? new User(id, username) : null;

const initReport = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    address: row.address,
    user: createUser(row.userId, row.username),
    employee: createUser(row.employeeId, row.employeeUsername),
    category: new Category(row.catId, row.categoryName),
    status: new Status(row.statusId, row.statusName),
    office: row.officeId ? new Office(row.officeId, row.officeName) : null,
    externalOffice: row.externalOfficeId ? new Office(row.externalOfficeId, row.externalOfficeName) : null,
    externalMaintainer: createUser( row.externalMaintainerId, row.externalMaintainerUsername),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    rejectReason: row.rejectReason,
    anonymous: row.anonymous,
    images: [],
    notifications: [],
    comments: [],
    unreadNotifications: row.unreadNotifications || 0,
    unreadComments: row.unreadComments || 0
});

const addImage = (report, row) => {
    if (!row.imageId) return;

    const exists = report.images.some(img => img.id === row.imageId);
    if (!exists) {
        report.images.push(
            new Image(
                row.imageId,
                `${IMAGE_BASE_URL}/reports/${report.id}/${row.imageUrl}`
            )
        );
    }
};

const addNotification = (report, row) => {
    if (!row.messageId) return;

    const exists = report.notifications.some(msg => msg.id === row.messageId);
    if (exists) return;

    const sender =
        createUser(row.notificationSenderId, row.notificationSenderUsername) ||
        createUser(row.senderId, row.senderUsername);

    const receiver =
        createUser(row.notificationReceiverId, row.notificationReceiverUsername) ||
        createUser(row.receiverId, row.receiverUsername);

    report.notifications.push(
        new Message({
            id: row.messageId,
            reportId: row.id,
            sender,
            receiver,
            text: row.notificationText ?? row.text,
            channel: row.channelId || 1,
            sendAt: row.notificationSendAt ?? row.sendAt,
            isRead: !!(row.notificationIsRead ?? row.isRead)
        })
    );
};

const addComment = (report, row) => {
    if (!row.commentId) return;

    const exists = report.comments.some(comm => comm.id === row.commentId);
    if (exists) return;

    const sender =
        createUser(row.commentSenderId, row.commentSenderUsername) ||
        createUser(row.senderId, row.senderUsername);

    const receiver =
        createUser(row.commentReceiverId, row.commentReceiverUsername) ||
        createUser(row.receiverId, row.receiverUsername);

    report.comments.push(
        new Comment(
            row.commentId,
            row.id,
            sender,
            receiver,
            row.commentText ?? row.text,
            row.commentSendAt ?? row.sendAt,
            row.commentIsRead ?? row.isRead
        )
    );
};


export default Mapper;