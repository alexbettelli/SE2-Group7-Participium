import { describe, it, expect } from 'vitest';
import Mapper from '../../utils/mapper.mjs';

describe('Mapper', () => {
    describe('mapRowToUser', () => {
        it('maps user row to User object', () => {
            const row = {
                id: 1,
                username: 'didem',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                typeId: 3,
                type: 'PR Officer',
                allowEmailNotification: 1,
                telegramUsername: 'didemtelegram',
                imageUrl: 'test.png'
            };
            const user = Mapper.mapRowToUser(row);
            expect(user).toBeDefined();
            expect(user.id).toBe(1);
            expect(user.username).toBe('didem');
            expect(user.email).toBe('test@example.com');
            expect(user.firstName).toBe('Test');
            expect(user.lastName).toBe('User');
            expect(user.role.id).toBe(3);
            expect(user.role.type).toBe('PR Officer');
            expect(user.allowEmailNotification).toBe(1);
            expect(user.telegramUsername).toBe('didemtelegram');
            expect(user.imageUrl).toContain('/profiles/test.png');
        });

        it('returns null for null input', () => {
            const user = Mapper.mapRowToUser(null);
            expect(user).toBeNull();
        });

        it('handles missing imageUrl', () => {
            const row = {
                id: 1,
                username: 'didem',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                typeId: 3,
                type: 'PR Officer',
                allowEmailNotification: 0,
                telegramUsername: null,
                imageUrl: null
            };
            const user = Mapper.mapRowToUser(row);
            expect(user.imageUrl).toBeNull();
        });
    });

    describe('mapRowsToUsers', () => {
        it('maps multiple user rows', () => {
            const rows = [
                {
                    id: 1,
                    username: 'user1',
                    email: 'user1@test.com',
                    firstName: 'user',
                    lastName: 'One',
                    typeId: 1,
                    type: 'Citizen',
                    allowEmailNotification: 1,
                    telegramUsername: null,
                    imageUrl: null
                },
                {
                    id: 2,
                    username: 'user2',
                    email: 'user2@test.com',
                    firstName: 'user',
                    lastName: 'Two',
                    typeId: 3,
                    type: 'PR Officer',
                    allowEmailNotification: 0,
                    telegramUsername: null,
                    imageUrl: null
                }
            ];
            const users = Mapper.mapRowsToUsers(rows);
            expect(users).toHaveLength(2);
            expect(users[0].username).toBe('user1');
            expect(users[1].username).toBe('user2');
        });

        it('returns empty array for empty input', () => {
            const users = Mapper.mapRowsToUsers([]);
            expect(users).toHaveLength(0);
        });
    });

    describe('mapRowToRole', () => {
        it('maps role row to Role object', () => {
            const row = {
                id: 3,
                type: 'PR Officer'
            };
            const role = Mapper.mapRowToRole(row);
            expect(role).toBeDefined();
            expect(role.id).toBe(3);
            expect(role.type).toBe('PR Officer');
        });

        it('returns null for null input', () => {
            const role = Mapper.mapRowToRole(null);
            expect(role).toBeNull();
        });
    });

    describe('mapRowsToRoles', () => {
        it('maps multiple role rows', () => {
            const rows = [
                { id: 1, type: 'Citizen' },
                { id: 3, type: 'PR Officer' }
            ];
            const roles = Mapper.mapRowsToRoles(rows);
            expect(roles).toHaveLength(2);
            expect(roles[0].id).toBe(1);
            expect(roles[1].id).toBe(3);
        });
    });

    describe('mapRowToCategory', () => {
        it('maps category row to Category object', () => {
            const row = {
                id: 1,
                categoryName: 'Roads'
            };
            const category = Mapper.mapRowToCategory(row);
            expect(category).toBeDefined();
            expect(category.id).toBe(1);
            expect(category.categoryName).toBe('Roads');
        });

        it('returns null for null input', () => {
            const category = Mapper.mapRowToCategory(null);
            expect(category).toBeNull();
        });
    });

    describe('mapRowsToCategories', () => {
        it('maps multiple category rows', () => {
            const rows = [
                { id: 1, categoryName: 'Roads' },
                { id: 2, categoryName: 'Waste' }
            ];
            const categories = Mapper.mapRowsToCategories(rows);
            expect(categories).toHaveLength(2);
            expect(categories[0].categoryName).toBe('Roads');
            expect(categories[1].categoryName).toBe('Waste');
        });
    });

    describe('mapRowToStatus', () => {
        it('maps status row to Status object', () => {
            const row = {
                id: 1,
                statusName: 'Pending'
            };
            const status = Mapper.mapRowToStatus(row);
            expect(status).toBeDefined();
            expect(status.id).toBe(1);
            expect(status.statusName).toBe('Pending');
        });

        it('returns null for null input', () => {
            const status = Mapper.mapRowToStatus(null);
            expect(status).toBeNull();
        });
    });

    describe('mapRowsToStatus', () => {
        it('maps multiple status rows', () => {
            const rows = [
                { id: 1, statusName: 'Pending' },
                { id: 2, statusName: 'Assigned' }
            ];
            const statuses = Mapper.mapRowsToStatus(rows);
            expect(statuses).toHaveLength(2);
            expect(statuses[0].statusName).toBe('Pending');
            expect(statuses[1].statusName).toBe('Assigned');
        });
    });

    describe('mapRowsToOffices', () => {
        it('maps office rows with employees', () => {
            const rows = [
                {
                    id: 1,
                    name: 'Office 1',
                    catId: 1,
                    categoryName: 'Roads',
                    employeeId: 10,
                    username: 'user1',
                    email: 'user1@test.com',
                    firstName: 'User',
                    lastName: 'One'
                },
                {
                    id: 1,
                    name: 'Office 1',
                    catId: 1,
                    categoryName: 'Roads',
                    employeeId: 99,
                    username: 'user2',
                    email: 'user2@test.com',
                    firstName: 'User',
                    lastName: 'Two'
                }
            ];
            const offices = Mapper.mapRowsToOffices(rows);
            expect(offices).toHaveLength(1);
            expect(offices[0].id).toBe(1);
            expect(offices[0].name).toBe('Office 1');
            expect(offices[0].category.id).toBe(1);
            expect(offices[0].employees).toHaveLength(2);
        });

        it('maps office without employees', () => {
            const rows = [
                {
                    id: 2,
                    name: 'Office 2',
                    catId: 2,
                    categoryName: 'Waste',
                    employeeId: null,
                    username: null,
                    email: null,
                    firstName: null,
                    lastName: null
                }
            ];
            const offices = Mapper.mapRowsToOffices(rows);
            expect(offices).toHaveLength(1);
            expect(offices[0].employees).toHaveLength(0);
        });
    });

    describe('mapRowToOffice', () => {
        it('maps single office row', () => {
            const rows = [
                {
                    id: 1,
                    name: 'Office 1',
                    catId: 1,
                    categoryName: 'Roads',
                    employeeId: null,
                    username: null,
                    email: null,
                    firstName: null,
                    lastName: null
                }
            ];
            const office = Mapper.mapRowToOffice(rows);
            expect(office).toBeDefined();
            expect(office.id).toBe(1);
            expect(office.name).toBe('Office 1');
        });
    });

    describe('mapRowToMessage', () => {
        it('maps message row to Message object', () => {
            const row = {
                id: 1,
                reportId: 5,
                senderId: 10,
                senderUsername: 'sender',
                senderEmail: 'sender@test.com',
                senderFirstName: 'Sender',
                senderLastName: 'User',
                senderTypeId: 1,
                receiverId: 20,
                receiverUsername: 'receiver',
                receiverEmail: 'receiver@test.com',
                receiverFirstName: 'Receiver',
                receiverLastName: 'User',
                receiverTypeId: 1,
                text: 'Hello',
                channelId: 1,
                channelName: 'Email',
                sendAt: '2025-01-01T00:00:00Z',
                isRead: 0
            };
            const message = Mapper.mapRowToMessage(row);
            expect(message).toBeDefined();
            expect(message.id).toBe(1);
            expect(message.reportId).toBe(5);
            expect(message.sender.id).toBe(10);
            expect(message.receiver.id).toBe(20);
            expect(message.text).toBe('Hello');
            expect(message.channel.id).toBe(1);
            expect(message.isRead).toBe(false);
        });

        it('returns null for null input', () => {
            const message = Mapper.mapRowToMessage(null);
            expect(message).toBeNull();
        });

        it('handles message without sender', () => {
            const row = {
                id: 1,
                reportId: 5,
                senderId: null,
                receiverId: 20,
                receiverUsername: 'receiver',
                text: 'Test',
                channelId: 1,
                sendAt: '2025-01-01T00:00:00Z',
                isRead: 0
            };
            const message = Mapper.mapRowToMessage(row);
            expect(message.sender).toBeNull();
        });
    });

    describe('mapRowsToMessage', () => {
        it('maps multiple message rows', () => {
            const rows = [
                {
                    id: 1,
                    reportId: 5,
                    senderId: 10,
                    senderUsername: 'sender1',
                    receiverId: 20,
                    receiverUsername: 'receiver',
                    text: 'Message 1',
                    channelId: 1,
                    sendAt: '2025-01-01T00:00:00Z',
                    isRead: 0
                },
                {
                    id: 2,
                    reportId: 5,
                    senderId: 11,
                    senderUsername: 'sender2',
                    receiverId: 20,
                    receiverUsername: 'receiver',
                    text: 'Message 2',
                    channelId: 1,
                    sendAt: '2024-01-02T00:00:00Z',
                    isRead: 1
                }
            ];
            const messages = Mapper.mapRowsToMessage(rows);
            expect(messages).toHaveLength(2);
            expect(messages[0].id).toBe(1);
            expect(messages[1].id).toBe(2);
        });
    });

    describe('mapRowToComment', () => {
        it('maps comment row to Comment object', () => {
            const row = {
                commentId: 1,
                reportId: 5,
                senderId: 10,
                senderUsername: 'sender',
                receiverId: 20,
                receiverUsername: 'receiver',
                commentText: 'Test comment',
                commentSendAt: '2025-01-01T00:00:00Z',
                commentIsRead: 0
            };
            const comment = Mapper.mapRowToComment(row);
            expect(comment).toBeDefined();
            expect(comment.id).toBe(1);
            expect(comment.reportId).toBe(5);
            expect(comment.sender.id).toBe(10);
            expect(comment.receiver.id).toBe(20);
            expect(comment.text).toBe('Test comment');
            expect(comment.isRead).toBe(0);
        });

        it('returns null for null input', () => {
            const comment = Mapper.mapRowToComment(null);
            expect(comment).toBeNull();
        });

    });

    describe('mapRowsToComments', () => {
        it('maps multiple comment rows', () => {
            const rows = [
                {
                    commentId: 1,
                    reportId: 5,
                    senderId: 10,
                    senderUsername: 'sender1',
                    receiverId: 20,
                    receiverUsername: 'receiver',
                    commentText: 'Comment 1',
                    commentSendAt: '2025-01-01T00:00:00Z',
                    commentIsRead: 0
                },
                {
                    commentId: 2,
                    reportId: 5,
                    senderId: 11,
                    senderUsername: 'sender2',
                    receiverId: 20,
                    receiverUsername: 'receiver',
                    commentText: 'Comment 2',
                    commentSendAt: '2024-01-02T00:00:00Z',
                    commentIsRead: 1
                }
            ];
            const comments = Mapper.mapRowsToComments(rows);
            expect(comments).toHaveLength(2);
            expect(comments[0].id).toBe(1);
            expect(comments[1].id).toBe(2);
        });
    });

    describe('mapRowsToReports', () => {
        it('maps report rows with images and notifications', () => {
            const rows = [
                {
                    id: 1,
                    title: 'Test Report',
                    description: 'Description',
                    latitude: 45.2,
                    longitude: 7.6,
                    address: 'Test Address',
                    userId: 10,
                    username: 'didem',
                    employeeId: 20,
                    employeeUsername: 'emp1',
                    catId: 1,
                    categoryName: 'Roads',
                    statusId: 1,
                    statusName: 'Pending',
                    officeId: 1,
                    officeName: 'Office 1',
                    externalOfficeId: null,
                    externalOfficeName: null,
                    externalMaintainerId: null,
                    externalMaintainerUsername: null,
                    createdAt: '2025-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                    rejectReason: null,
                    anonymous: 0,
                    imageId: 100,
                    imageUrl: 'img1.png',
                    messageId: null,
                    notificationSenderId: null,
                    notificationReceiverId: null,
                    notificationText: null,
                    notificationSendAt: null,
                    notificationIsRead: null,
                    commentId: null,
                    commentSenderId: null,
                    commentReceiverId: null,
                    commentText: null,
                    commentSendAt: null,
                    commentIsRead: null,
                    unreadNotifications: 1,
                    unreadComments: 0
                },
                {
                    id: 1,
                    title: 'Test Report',
                    description: 'Description',
                    latitude: 45.3,
                    longitude: 7.4,
                    address: 'Test Address',
                    userId: 10,
                    username: 'didem',
                    employeeId: 20,
                    employeeUsername: 'emp1',
                    catId: 1,
                    categoryName: 'Roads',
                    statusId: 1,
                    statusName: 'Pending',
                    officeId: 1,
                    officeName: 'Office 1',
                    externalOfficeId: null,
                    externalOfficeName: null,
                    externalMaintainerId: null,
                    externalMaintainerUsername: null,
                    createdAt: '2025-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                    rejectReason: null,
                    anonymous: 0,
                    imageId: 101,
                    imageUrl: 'img2.png',
                    messageId: 200,
                    notificationSenderId: 30,
                    notificationSenderUsername: 'sender',
                    notificationReceiverId: 10,
                    notificationReceiverUsername: 'user1',
                    notificationText: 'Test notification',
                    notificationSendAt: '2024-01-02T00:00:00Z',
                    notificationIsRead: 0,
                    commentId: null,
                    commentSenderId: null,
                    commentReceiverId: null,
                    commentText: null,
                    commentSendAt: null,
                    commentIsRead: null,
                    unreadNotifications: 1,
                    unreadComments: 0
                }
            ];
            const reports = Mapper.mapRowsToReports(rows);
            expect(reports).toHaveLength(1);
            expect(reports[0].id).toBe(1);
            expect(reports[0].title).toBe('Test Report');
            expect(reports[0].images).toHaveLength(2);
            expect(reports[0].notifications).toHaveLength(1);
            expect(reports[0].unreadNotifications).toBe(1);
        });
    });

    describe('mapRowsToReport', () => {
        it('maps single report row', () => {
            const rows = [
                {
                    id: 1,
                    title: 'Test Report',
                    description: 'Description',
                    latitude: 45.9,
                    longitude: 7.1,
                    address: 'Test Address',
                    userId: 10,
                    username: 'didem',
                    employeeId: null,
                    employeeUsername: null,
                    catId: 1,
                    categoryName: 'Roads',
                    statusId: 1,
                    statusName: 'Pending',
                    officeId: null,
                    officeName: null,
                    externalOfficeId: null,
                    externalOfficeName: null,
                    externalMaintainerId: null,
                    externalMaintainerUsername: null,
                    createdAt: '2025-01-01T00:00:00Z',
                    updatedAt: '2025-01-01T00:00:00Z',
                    rejectReason: null,
                    anonymous: 0,
                    imageId: null,
                    imageUrl: null,
                    messageId: null,
                    notificationSenderId: null,
                    notificationReceiverId: null,
                    notificationText: null,
                    notificationSendAt: null,
                    notificationIsRead: null,
                    commentId: null,
                    commentSenderId: null,
                    commentReceiverId: null,
                    commentText: null,
                    commentSendAt: null,
                    commentIsRead: null,
                    unreadNotifications: 0,
                    unreadComments: 0
                }
            ];
            const report = Mapper.mapRowsToReport(rows);
            expect(report).toBeDefined();
            expect(report.id).toBe(1);
            expect(report.title).toBe('Test Report');
        });
    });
});

