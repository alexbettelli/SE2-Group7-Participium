import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import dayjs from 'dayjs';

beforeEach(() => vi.spyOn(console, 'log').mockImplementation(() => {}));
afterEach(() => { console.log.mockRestore(); vi.restoreAllMocks(); });

vi.mock('sqlite3', () => {
  const norm = (maybeParams, maybeCb) => {
    const params = Array.isArray(maybeParams) ? maybeParams : [];
    const cb = typeof maybeParams === 'function' ? maybeParams : maybeCb;
    return { params, cb };
  };

  class Database {
    constructor(_path, cb) { if (cb) cb(null); }

    static resetStore() {
      Database._users = [
        { id: 1, username: 'existing', password: 'secret', email: 'e@e', firstName: 'Ex', lastName: 'Ist', typeId: 1 },
        { id: 2, username: 'unassigned_emp', password: 'pass', email: 'u@u', firstName: 'Un', lastName: 'Assigned', typeId: 5 }
      ];
      Database._offices = [
        { id: 1, name: 'Office for Road Maintenance' },
        { id: 2, name: 'Office A' }
      ];
      Database._nextUserId = 10;
      Database._nextOfficeId = 10;
      Database._nextReportId = 10;
      Database._nextNotificationId = 10;

      Database.report = {
        id: 1,
        title: 'Pothole on Main St',
        description: 'There is a large pothole on Main St that needs fixing.',
        statusId: 1,
        catId: 1,
        userId: 1,
        latitude: 40.7128,
        longitude: -74.0060,
        address: 'Main St, Cityville',
        createdAt: new dayjs().toString(),
        anonymous: 0,
        images: []
      }

      Database._categories = [
        { id: 1, categoryName: 'Plumbing' },
        { id: 2, categoryName: 'Electrical'},
        { id: 3, categoryName: 'Landscaping' }
      ]
      Database.roles = [
        { id: 1, name: 'CItizen' },
        { id: 2, name: 'System Administrator'},
        { id: 3, name: 'Municipal Public Relations Officer' },
        { id: 4, name: 'Technical Office Staff Member' },
        { id: 5, name: 'Unassigned Employee' },
      ]
      Database._notifications =  [
        { id: 1, reportId: 1, senderId: 1, receiverId: 2, text: 'Notification 1', channelId: 1, sendAt: new dayjs().toString(), isRead: 0 },
        { id: 2, reportId: 1, senderId: 1, receiverId: 2, text: 'Notification 2', channelId: 1, sendAt: new dayjs().toString(), isRead: 0 },
        { id: 3, reportId: 1, senderId: 1, receiverId: 2, text: 'Notification 3', channelId: 1, sendAt: new dayjs().toString(), isRead: 0 },
        { id: 4, reportId: 1, senderId: 1, receiverId: 2, text: 'Notification 4', channelId: 1, sendAt: new dayjs().toString(), isRead: 1 },
        { id: 5, reportId: 1, senderId: 1, receiverId: 1, text: 'Notification 5', channelId: 1, sendAt: new dayjs().toString(), isRead: 0 }
      ]
    }

    run(sql, maybeParams, maybeCb) {
      const { params, cb } = norm(maybeParams, maybeCb);
      const q = String(sql).toLowerCase();

      try {
        if (q.includes('insert into user')) {
          const username = params[0] ?? null;
          if (username && Database._users.some(u => u.username === username)) { 
            return cb && cb(new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: user.username')); //username unique
          }
          const id = Database._nextUserId++;
          const [u, password, email, firstName, lastName, typeId] = params;
          Database._users.push({
            id,
            username: u,
            password: password,
            email: email,
            firstName: firstName,
            lastName: lastName,
            typeId: typeId
          });
          return cb && cb.call({ lastID: id }, null);
        }

        // INSERT office
        if (q.includes('insert into office')) {
          const id = Database._nextOfficeId++;
          const name = params[0] ?? 'unknown';
          Database._offices.push({ id, name });
          return cb && cb.call({ lastID: id }, null);
        }

        // DELETE offices
        if (q.includes('delete from office')) {
          Database._offices = [];
          return cb && cb(null);
        }

        // UPDATE user SET typeId = ? WHERE ...
        if (q.includes('update user set') && q.includes('typeid')) {
          const [newType, where] = params;
          if (typeof where === 'number') {
            Database._users.forEach(u => { if (u.typeId === where) u.typeId = newType; });
          } else if (typeof where === 'string') {
            Database._users.forEach(u => { if (u.username === where) u.typeId = newType; });
          }
          return cb && cb(null);
        }

        //INSERT report
        if (q.includes('insert into report') || q.includes('insert into report_image')) {
          const id = Database._nextReportId++;
          return cb && cb.call({ lastID: id }, null);
        }

        //UPDATE report status
        if (q.includes('update report set statusid')) {
          return cb && cb(null);
        }

        //INSERT notification
        if (q.includes('insert into notification')) {
          const id = Database._nextNotificationId++;
          const [reportId, senderId, receiverId, text, channelId, sendAt] = params;
          Database._notifications.push({
            id, reportId, senderId, receiverId, text, channelId, sendAt, isRead: 0
          });
          return cb && cb.call({ lastID: id }, null);
        }
        

        //UPDATE notification SET isRead = 1 WHERE ...
        if (q.includes('update notification set isread')) {
          const [reportId, receiverId] = params;
          let changes = 0;
          const notifications = Database._notifications.filter(n => n.receiverId === receiverId && n.reportId === reportId && n.isRead === 0);
          for (const n of notifications) {
            n.isRead = 1;
            changes++;
          }

          return cb && cb.call({ changes }, null);
        }

        //UPDATE user profile
        if (q.includes('update user') && q.includes('set')) {
          const [telegramUsername, allowEmailNotification, imageUrl, userId] = params;
          const user = Database._users.find(u => u.id === userId);
          if (user) {
            user.telegramUsername = telegramUsername;
            user.allowEmailNotification = allowEmailNotification;
            user.imageUrl = imageUrl;
          }
          return cb && cb(null);
        }

        // default: success no-op
        return cb && cb(null);
      } catch (err) {
        return cb && cb(err);
      }
    }

    get(sql, maybeParams, maybeCb) {
      const { params, cb } = norm(maybeParams, maybeCb);
      const q = String(sql).toLowerCase();

      try {
        if (q.includes('from user') && q.includes('where username')) {
          const username = params[0] ?? null;
          const row = Database._users.find(u => u.username === username);
          return cb && cb(null, row);
        }
        if (q.includes('from user') && q.includes('where id')) {
          const id = Number(params[0]);
          const row = Database._users.find(u => u.id === id);
          return cb && cb(null, row);
        }
        if(q.includes('from notification') || q.includes('join notification')) {
          const id = Number(params[0]);
          const row = Database._notifications.find(n => n.id === id);
          return cb && cb(null, row);
        }

        return cb && cb(null, undefined);
      } catch (err) {
        return cb && cb(err);
      }
    }

    all(sql, maybeParams, maybeCb) {
      const { params, cb } = norm(maybeParams, maybeCb);
      const q = String(sql).toLowerCase();
      try {
        if (q.includes('from user') && q.includes('typeid')) {
          return cb && cb(null, Database._users.filter(u => Number(u.typeId) === 5));
        }
        if (q.includes('from office')) {
          return cb && cb(null, Database._offices.slice());
        }

         //GET categories
        if (q.includes('from report_category')) {
           return cb && cb(null, Database._categories);
        }
        if (q.includes('from user_type')) {
           return cb && cb(null, Database.roles.filter(r => [3, 4].includes(r.id)));
        }
        if(q.includes('from notification')) {
          const receiverId = Number(params[0]);
          const rows = Database._notifications.filter(n => n.receiverId === receiverId && n.isRead === 0);
          return cb && cb(null, rows);
        }
        return cb && cb(null, []);
      } catch (err) {
        return cb && cb(err);
      }
    }

    close(cb) { if (cb) cb(null); }
  }

  Database.resetStore();
  return { default: { Database } };
});

import sqlite3 from 'sqlite3';
let DAO;

beforeEach(async () => {
  sqlite3.Database.resetStore();
  ({ default: DAO } = await import('../../dao/DAO.mjs'));
});

afterEach(() => {
  sqlite3.Database.resetStore();
});

describe('DAO (server/dao/DAO.mjs)', () => {
  describe('getUserByUsername', () => {
    it('returns user info when user exists', async () => {
      const info = await DAO.getUserByUsername('existing');
      expect(info).toBeTruthy();
      expect(info.user).toBeTruthy();
      expect(info.user.username).toBe('existing');
      expect(info.password).toBe('secret');
    });

    it('returns null when not found', async () => {
      const info = await DAO.getUserByUsername('noone');
      expect(info).toBeNull();
    });

    it('handles null/undefined input gracefully', async () => {
      await expect(DAO.getUserByUsername(null)).resolves.toBeNull();
      await expect(DAO.getUserByUsername(undefined)).resolves.toBeNull();
    });
  });

  describe('addNewUser', () => {
    it('inserts a new user and returns new id', async () => {
      const data = {
        username: 'newuser',
        password: 'pw',
        email: 'n@e',
        firstName: 'New',
        lastName: 'User',
        typeId: 1
      };
      const id = await DAO.addNewUser(data);
      expect(typeof id).toBe('number');

      const fetched = await DAO.getUserByUsername('newuser');
      expect(fetched).toBeTruthy();
      expect(fetched.user.username).toBe('newuser');
    });

    it('throws error when inserting a user with existing username', async () => {
      const data = {
        username: 'existing',
        password: 'pw',
        email: 'e2@e',
        firstName: 'Ex2',
        lastName: 'Ist2',
        typeId: 1
      };
      await expect(DAO.addNewUser(data)).rejects.toThrow();
    });

    it('propagates DB error when run fails (simulated)', async () => {
      const spy = vi.spyOn(sqlite3.Database.prototype, 'run').mockImplementation(function (_sql, _params, cb) {
        cb && cb(new Error('simulated db error'));
      });

      await expect(DAO.addNewUser({ username: 'bad', password: 'p' })).rejects.toThrow('simulated db error');

      spy.mockRestore();
    });
  });

  describe('getUnassignedEmployees', () => {
    it('returns users with typeId == 5', async () => {
      const list = await DAO.getUnassignedEmployees();
      expect(Array.isArray(list)).toBe(true);
      expect(list.some(u => u.username === 'unassigned_emp')).toBe(true);
    });

    it('returns empty array when none are unassigned', async () => {
      //set all users to typeId 1
      sqlite3.Database._users.forEach(u => { u.typeId = 1; });
      const list = await DAO.getUnassignedEmployees();
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(0);
    });
  });

  describe('getOffices', () => {
    it('returns seeded offices', async () => {
      const offices = await DAO.getOffices();
      expect(Array.isArray(offices)).toBe(true);
      const names = offices.map(o => o.name);
      expect(names).toEqual(expect.arrayContaining(['Office A', 'Office for Road Maintenance']));
    });

    it('returns empty array when no offices', async () => {
      sqlite3.Database._offices = [];
      const offices = await DAO.getOffices();
      expect(Array.isArray(offices)).toBe(true);
      expect(offices.length).toBe(0);
    });
  });

  describe('getCategories', () => {
    it('returns seeded categories', async () => {
      const categories = await DAO.getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBe(3);
      const names = categories.map(c => c.categoryName);
      expect(names).toEqual(expect.arrayContaining(['Plumbing', 'Electrical', 'Landscaping']));
      }
    )
  })
  describe('getRoles', () => {
    it('returns mucipal users roles', async () => {
      const roles = await DAO.getRoles();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBe(2);
      const names = roles.map(c => c.id);
      expect(names).toEqual([3, 4]);
      }
    )
  })
  describe('assignEmployeeToOffice', () => {
    it('assign employee to an Office', async () => {
      const data = {
        employeeId : 2,
        officeId : 1,
        roleId : 3
      }
      const assignedEmp = await DAO.assignEmployeeToOffice(data.employeeId, data.officeId, data.roleId);
      expect(assignedEmp).toBe(undefined);      
    })
  })

  describe('addNewReport', () => {
    it('add a new report', async () => {
      const newReport = {
        title : "fake title", 
        description : "fake description", 
        latitude : 45.10000, 
        longitude : 32.25,
        address : "indirizzo falso", 
        userId : 1, 
        catId : 1, 
        statusId : 1 , 
        createdAt: "Tue Nov 12 2025 15:42:10 GMT+0100", 
        anonymous: 1,
        images: ['img1.png', 'img2.png']
      }
      const report = await DAO.addNewReport(newReport);
      expect(report).toBeTruthy();
      expect(report.id).toBeTruthy();
      expect(report.title).toBe("fake title");
      expect(report.description).toBe("fake description");
      expect(report.latitude).toBe( 45.10000);
      expect(report.longitude).toBe(32.25);
      expect(report.address).toBe("indirizzo falso");
      expect(report.userId).toBe(1);
      expect(report.catId).toBe(1);
      expect(report.statusId).toBe(1);
      expect(report.createdAt).toBe("Tue Nov 12 2025 15:42:10 GMT+0100");
      expect(report.anonymous).toBe(1);
      expect(Array.isArray(report.images)).toBe(true);
      expect(report.images.length).toBe(2);
      });
    });
  });

  describe('DAO - createNotification', () => {
    it('creates a new notification successfully', async () => {
      // arrange
      const message = {
        reportId: 1,
        senderId: 1,
        receiverId: 2,
        text: 'This is a test notification',
        channelId: 1
      };

      // act
      const now = new dayjs().toString();
      const result = await DAO.createNotification(message);
      console.debug("RESULT: "+JSON.stringify(result));

      // assert
      expect(result.reportId).toBe(message.reportId);
      expect(result.sender.id).toBe(message.senderId);
      expect(result.receiver.id).toBe(message.receiverId);
      expect(result.text).toBe(message.text);
      expect(result.channel.id).toBe(message.channelId);
      expect(result.isRead).toBe(false);
      expect(result.sendAt.toString()).toBe(now);
    });
  });

  describe('DAO - getUnreadNotifications', () => {
    it('retrieves unread notifications for a user', async () => {
      // arrange
      const userId = 2;

      // act
      const notifications = await DAO.getUnreadNotifications(userId);

      // assert
      expect(notifications).toBe(3);
    });

    it('returns zero when user has no unread notifications', async () => {
      // arrange
      const userId = 3;

      // act
      const notifications = await DAO.getUnreadNotifications(userId);

      // assert
      expect(notifications).toBe(0);
    });
  });

  describe('DAO - setNotificationsAsRead', () => {
    it('marks a notification as read successfully', async () => {
      // arrange
      const userId = 2;
      const reportId = 1;

      // act
      const result = await DAO.setNotificationsAsRead(userId, reportId);

      // assert
      expect(result).toBe(3);
    });

    it('marks a notification as read successfully for user 1', async () => {
      // arrange
      const userId = 1;
      const reportId = 1;

      // act
      const result = await DAO.setNotificationsAsRead(userId, reportId);

      // assert
      expect(result).toBe(1);
    });

    it('marks a notification as read for non existing user', async () => {
      // arrange
      const userId = 999;
      const reportId = 1;

      // act
      const result = await DAO.setNotificationsAsRead(userId, reportId);

      // assert
      expect(result).toBe(0);
    });
  });

  describe('DAO - UpdateUserProfile', () => {
    it('updates user profile successfully', async () => {
      // arrange
      const userId = 1;
      const telegramUsername = 'new_telegram';
      const allowEmailNotification = 1;
      const imageUrl = 'image.png';

      // act
      const result = await DAO.updateUserProfile(userId, telegramUsername, allowEmailNotification, imageUrl);

      // assert
      expect(result.id).toBe(userId);
      expect(result.username).toBe('existing');
      expect(result).toHaveProperty('telegramUsername', telegramUsername);
      expect(result).toHaveProperty('allowEmailNotification', allowEmailNotification);
      expect(result).toHaveProperty('imageUrl', `//images/profiles/${imageUrl}`);
    });

    it('handles updating non-existing user gracefully', async () => {
      // arrange
      const userId = 999; // non-existing user
      const telegramUsername = 'ghost_telegram';
      const allowEmailNotification = 0;
      const imageUrl = 'http://example.com/ghost_image.png';

      // act
      const result = await DAO.updateUserProfile(userId, telegramUsername, allowEmailNotification, imageUrl);
      
      // assert
      expect(result).toBeNull();
    });
  });

  describe('DAO - getUsernameByUserId', () => {
    it('returns username when user exists', async () => {
      // arrange
      const userId = 1;

      // act
      const username = await DAO.getUsernameByUserId(userId);

      // assert
      expect(username).toBe('existing');
    });

    it('returns null when user does not exist', async () => {
      // arrange
      const userId = 999;

      // act
      const username = await DAO.getUsernameByUserId(userId);

      // assert
      expect(username).toBeNull();
    });
  });

  describe('rejectReport', () => {
    it('updates report status and reason', async () => {
      const calls = [];
      const spy = vi.spyOn(sqlite3.Database.prototype, 'run').mockImplementation(function (sql, params, cb) {
        calls.push({ sql: String(sql), params });
        cb && cb.call(this, null);
      });

      await expect(DAO.rejectReport(5, 'not valid')).resolves.toBeUndefined();

      expect(calls.length).toBeGreaterThan(0);
      const { sql, params } = calls[0];
      expect(sql.toLowerCase()).toContain('update report');
      expect(params[0]).toBe('not valid');
      // report is the last parameter passed to db.run
      expect(params[params.length - 1]).toBe(5);

      spy.mockRestore();
    });
  });

  describe('assignReportToOfficer', () => {
    it('assigns report to officer with correct parameters', async () => {
      const calls = [];
      const spy = vi.spyOn(sqlite3.Database.prototype, 'run').mockImplementation(function (sql, params, cb) {
        calls.push({ sql: String(sql), params });
        cb && cb.call(this, null);
      });

      await expect(DAO.assignReportToOfficer(10, 3, 2, 4)).resolves.toBeUndefined();

      expect(calls.length).toBeGreaterThan(0);
      const { sql, params } = calls[0];
      expect(sql.toLowerCase()).toContain('update report');
      expect(params[0]).toBe(4); // officer id
      expect(params[1]).toBe(2); // office id
      expect(params[2]).toBe(3); // category Id
      expect(params[4]).toBe(10); // report Id

      spy.mockRestore();
    });
  });

  describe('getReportStatuses', () => {
    it('returns list of report statuses from DB', async () => {
      const fakeStatuses = [
        { id: 1, statusName: 'Pending' },
        { id: 2, statusName: 'Approved' }
      ];

      const spy = vi.spyOn(sqlite3.Database.prototype, 'all').mockImplementation(function (_sql, _params, cb) {
        cb && cb(null, fakeStatuses);
      });

      const result = await DAO.getReportStatuses();
      expect(result).toEqual(fakeStatuses);

      spy.mockRestore();
    });
  });

  describe('getCategoryById', () => {
    it('returns category for a given id', async () => {
      const fakeCategory = { id: 1, categoryName: 'Plumbing' };

      const spy = vi.spyOn(sqlite3.Database.prototype, 'get').mockImplementation(function (_sql, _params, cb) {
        cb && cb(null, fakeCategory);
      });
      

      const category = await DAO.getCategoryById(1);
      expect(category).toEqual(fakeCategory);

      spy.mockRestore();
    });
  });

  describe('getStatusById', () => {
    it('returns status for a given id', async () => {
      const fakeStatus = { id: 1, statusName: 'Pending' };
      const spy = vi.spyOn(sqlite3.Database.prototype, 'get').mockImplementation(function (_sql, _params, cb) {
        cb && cb(null, fakeStatus);
      });

      const status = await DAO.getStatusById(1);
      expect(status).toEqual(fakeStatus);
      spy.mockRestore();
    });
  });
  
  describe('updateReportStatus', () => {
    it('exectues UPDATE report SET statusId with correct parameters', async () => {
      const reportId = 1;
      const employeeId = 5;
      const reporterUserId = 1;

      const reportRow = { id: reportId, employeeId: employeeId, userId: reporterUserId };
      const notificationRow = {
        id: 999,
        reportId,
        senderId: null,
        receiverId: reporterUserId,
        text: 'stub',
        channelId: 1,
        sendAt: new dayjs().toString()
      };

      const getSpy = vi.spyOn(sqlite3.Database.prototype, 'get')
        .mockImplementationOnce(function (_sql, _params, cb) { cb && cb(null, reportRow); })
        .mockImplementationOnce(function (_sql, _params, cb) { cb && cb(null, notificationRow); });

      const runCalls = [];
      
      const originalRun = sqlite3.Database.prototype.run;

      const runSpy = vi.spyOn(sqlite3.Database.prototype, 'run').mockImplementation(function (sql, params, cb) {
        const q = String(sql).toLowerCase();
        
        if (q.includes('insert into notification')) {
          return originalRun.call(this, sql, params, cb);
        }
        
        runCalls.push({ sql: String(sql), params });
        return cb && cb(null);
      });

      const newStatus = 3;
      await DAO.updateReportStatus(employeeId, reportId, newStatus);

      const updateCall = runCalls.find(c => c.sql.toLowerCase().includes('update report set statusid'));
      expect(updateCall).toBeTruthy();
      expect(updateCall.params[0]).toBe(newStatus);
      expect(updateCall.params[2]).toBe(reportId);

      getSpy.mockRestore();
      runSpy.mockRestore();
    });
  });

  describe('getReportsByUserId', () => {
    it('return reports for a given user id', async () => {
      const rows = [
        {
          id: 1,
          title: 'Test report 1',
          description: 'Test description',
          latitude: 12.34,
          longitude: 56.78,
          address: 'Corso Raffaello',
          userId: 1,
          username: 'user1',
          employeeId: null,
          employeeUsername: null,
          catId: 1,
          categoryName: 'Category',
          statusId: 1,
          statusName: 'Pending',
          officeId: null,
          officeName: null,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          rejectReason: null,
          anonymous: 0,
          imageId: 10,
          imageUrl: 'http://example.com/img.png'
        },
        {
          id: 2,
          title: 'Test report 2',
          description: 'Test description',
          latitude: 12.34,
          longitude: 56.78,
          address: 'Corso Raffaello',
          userId: 1,
          username: 'user1',
          employeeId: null,
          employeeUsername: null,
          catId: 1,
          categoryName: 'Category',
          statusId: 1,
          statusName: 'Pending',
          officeId: null,
          officeName: null,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          rejectReason: null,
          anonymous: 0,
          imageId: 10,
          imageUrl: 'http://example.com/img.png'
        },
        {
          id: 3,
          title: 'Test report',
          description: 'Test description',
          latitude: 12.34,
          longitude: 56.78,
          address: 'Corso Raffaello',
          userId: 1,
          username: 'user1',
          employeeId: null,
          employeeUsername: null,
          catId: 1,
          categoryName: 'Category',
          statusId: 1,
          statusName: 'Pending',
          officeId: null,
          officeName: null,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          rejectReason: null,
          anonymous: 0,
          imageId: 10,
          imageUrl: 'http://example.com/img.png'
        }
      ];

      const spy = vi.spyOn(sqlite3.Database.prototype, 'all').mockImplementation(function (_sql, _params, cb) {
        cb && cb(null, rows);
      });

      const reports = await DAO.getReportsByUserId(1);
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBe(3);
      expect(reports[0].title).toBe('Test report 1');
      expect(reports[1].title).toBe('Test report 2');

      spy.mockRestore();
    });
  });

  describe('getAllReports', () => {
    it('maps DB rows to Report objects', async () => {
      const rows = [
        {
          id: 1,
          title: 'Test report',
          description: 'Test description',
          latitude: 12.34,
          longitude: 56.78,
          address: 'Corso Raffaello',
          userId: 1,
          username: 'user1',
          employeeId: null,
          employeeUsername: null,
          catId: 1,
          categoryName: 'Category',
          statusId: 1,
          statusName: 'Pending',
          officeId: null,
          officeName: null,
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z',
          rejectReason: null,
          anonymous: 0,
          imageId: 10,
          imageUrl: 'http://example.com/img.png'
        }
      ];

      const spy = vi.spyOn(sqlite3.Database.prototype, 'all').mockImplementation(function (_sql, _params, cb) {
        cb && cb(null, rows);
      });

      const reports = await DAO.getAllReports();
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBe(1);
      expect(reports[0].title).toBe('Test report');
      expect(reports[0].user.username).toBe('user1');

      spy.mockRestore();
    });
  });

  

  describe('getUnassignedReports', () => {
    it('returns mapped reports for unassigned reports', async () => {
      const rows = [
        {
          id: 2,
          title: 'Unassigned',
          description: 'desc',
          latitude: 1,
          longitude: 2,
          address: 'Addr',
          userId: 1,
          username: 'citizen',
          employeeId: null,
          employeeUsername: null,
          catId: 1,
          categoryName: 'Category',
          statusId: 1,
          statusName: 'Pending',
          officeId: null,
          officeName: null,
          createdAt: '1999-01-02T00:00:00.000Z',
          updatedAt: '1999-01-02T00:00:00.000Z',
          rejectReason: null,
          anonymous: 0,
          imageId: 20,
          imageUrl: 'http://example.com/didem.png'
        }
      ];

      const spy = vi.spyOn(sqlite3.Database.prototype, 'all').mockImplementation(function (_sql, _params, cb) {
        cb && cb(null, rows);
      });

      const reports = await DAO.getUnassignedReports();
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBe(1);
      expect(reports[0].title).toBe('Unassigned');
      expect(reports[0].user.username).toBe('citizen');

      spy.mockRestore();
    });
  });

  