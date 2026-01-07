import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import db from '../../data/db.mjs';
import UserDAO from '../../dao/UserDAO.mjs';
import bcrypt from 'bcrypt';
import {
    setupTestDatabase,
    teardownTestDatabase
} from '../setup.mjs';

beforeAll(async () => {
    await setupTestDatabase();
});

afterAll(async () => {
    await teardownTestDatabase();
});

// restore mocks after each test globally
afterEach(() => {
    vi.restoreAllMocks();
});

describe('UserDAO', () => {

    describe('getUserByUsername', () => {
        it('returns user info when user exists', async () => {
            const info = await UserDAO.getUserByUsername('user');
            expect(info).toBeTruthy();
            expect(info).toHaveProperty('user');
            expect(info).toHaveProperty('password');
            expect(info.user.username).toBe('user');
        });

        it('returns null when not found', async () => {
            const info = await UserDAO.getUserByUsername('noone');
            expect(info).toBeNull();
        });

        it('handles null/undefined input gracefully', async () => {
            await expect(UserDAO.getUserByUsername(null)).resolves.toBeNull();
            await expect(UserDAO.getUserByUsername(undefined)).resolves.toBeNull();
        });
    })
    describe('getUserById', () => {
        it('should returns user by ID successfully', async () => {
            const userId = 1;

            const user = await UserDAO.getUserById(userId);

            expect(user).toBeDefined();
            expect(user.id).toBe(userId);
            expect(user).toHaveProperty('username', 'user');
        });

        it('should return null for non-existing user ID', async () => {
            const userId = 999;
            const user = await UserDAO.getUserById(userId);
            expect(user).toBeNull();
        })
    });
    describe('addNewUser', async () => {
        const userData = {
            username: 'newuser',
            password: await bcrypt.hash('password123', 8),
            email: 'test@example.com',
            firstName: 'New',
            lastName: 'User',
            typeId: 1
        };
        it('should create a new user successfully', async () => {
            const userId = await UserDAO.addNewUser(userData);
            expect(userId).toBeTypeOf('number');
            expect(userId).toBeGreaterThan(0);

            const fetched = await UserDAO.getUserByUsername('newuser');
            expect(fetched).toBeTruthy();
            expect(fetched.user.username).toBe('newuser');
        });

        it('should fail when creating user with duplicate username', async () => {
            await expect(UserDAO.addNewUser(userData)).rejects.toThrow();
        });
    })
    describe('getUnassignedEmployees', async () => {
        const unassigned_emp = {
            username: 'unassigned_emp',
            password: await bcrypt.hash('unemppass', 8),
            email: '',
            firstName: 'unassigned',
            lastName: 'emp',
            typeId: 5,
            allowEmailNotification: 0
        };
        it('should returns empty array when none are unassigned', async () => {
            const list = await UserDAO.getUnassignedEmployees();
            expect(Array.isArray(list)).toBe(true);
            expect(list.length).toBe(0);
        });
        it('should returns users with typeId == 5 successfully', async () => {
            await UserDAO.addNewUser(unassigned_emp);
            const list = await UserDAO.getUnassignedEmployees();
            expect(Array.isArray(list)).toBe(true);
            expect(list.length).toBe(1);
            expect(list.some(u => u.username === 'unassigned_emp')).toBe(true);
        });
    });
    describe('assignEmployeeToOffice', async () => {

        it('should assing an employee to an PR office successfully', async () => {
            const unassignedPR = {
                username: 'newPR',
                password: await bcrypt.hash('password123', 8),
                email: 'newPR@example.com',
                firstName: 'New',
                lastName: 'PR',
                typeId: 5
            };
            const newPRuserId = await UserDAO.addNewUser(unassignedPR);
            const assignedEmp = await UserDAO.assignEmployeeToOffice(newPRuserId, null, 3);
            expect(assignedEmp).toBe(undefined);
            const newPRuser = await UserDAO.getUserById(newPRuserId);
            console.log(newPRuser);
            expect(newPRuser.role.id).toBe(3);
        })
        it('should assing an employee to a technical office successfully', async () => {
            const unassignedOfficer = {
                username: 'newOfficer',
                password: await bcrypt.hash('password123', 8),
                email: 'newOfficer@example.com',
                firstName: 'New',
                lastName: 'Officer',
                typeId: 5
            };
            const newOfficerId = await UserDAO.addNewUser(unassignedOfficer);
            const assignedEmp = await UserDAO.assignEmployeeToOffice(newOfficerId, 2, 4);
            expect(assignedEmp).toBe(undefined);
            const newTechUser = await UserDAO.getUserById(newOfficerId);
            expect(newTechUser.role.id).toBe(4);
        })
    })    
    describe('updateUserProfile', () => {
        it('should updates user profile successfully', async () => {
            const userId = 1;
            const telegramUsername = 'new_telegram';
            const allowEmailNotification = 1;
            const imageUrl = 'image.png';

            await UserDAO.updateUserProfile(userId, telegramUsername, allowEmailNotification, imageUrl);
            const result = await UserDAO.getUserById(userId);

            expect(result).toBeDefined();
            expect(result.id).toBe(userId);
            expect(result.username).toBe('user');
            expect(result).toHaveProperty('telegramUsername', telegramUsername);
            expect(result).toHaveProperty('allowEmailNotification', allowEmailNotification);
            expect(result).toHaveProperty('imageUrl');
            expect(result.imageUrl).toContain(`/profiles/${imageUrl}`);
        });

        it('handles updating non-existing user gracefully', async () => {
            const userId = 999;
            const telegramUsername = 'ghost_telegram';
            const allowEmailNotification = 0;
            const imageUrl = 'ghost_image.png';

            const result = await UserDAO.updateUserProfile(userId, telegramUsername, allowEmailNotification, imageUrl);

            expect(result).toBeNull();
        });
    });
    describe('getUsernameByTelegramUsername', () => {
        it('returns username for existing telegram username set by updateUserProfile', async () => {
            // `updateUserProfile` test above sets user 1 telegramUsername to 'new_telegram'
            const username = await UserDAO.getUsernameByTelegramUsername('new_telegram');
            expect(username).toBe('user');
        });

        it('returns username after setting telegram username for another user', async () => {
            // set telegram username for user id 4 (userOfficer)
            await UserDAO.updateUserProfile(4, 'tg_officer', 0, null);
            const username = await UserDAO.getUsernameByTelegramUsername('tg_officer');
            expect(username).toBe('userOfficer');
        });

        it('returns null when telegram username not found', async () => {
            const username = await UserDAO.getUsernameByTelegramUsername('this_does_not_exist');
            expect(username).toBeNull();
        });
    });
    describe('deleteEmployeeById', () => {
        it('should delete employee successfully', async () => {
            const employeeId = await UserDAO.addNewUser({
                username: 'todelete',
                password: await bcrypt.hash('pass', 8),
                email: 'delete@test.com',
                firstName: 'To',
                lastName: 'Delete',
                typeId: 5
            });

            await UserDAO.deleteEmployeeById(employeeId);

            const result = await UserDAO.getUserById(employeeId);
            expect(result).toBeNull();
        });
    });

    describe('UserDAO error handling', () => {
        it('handles db errors in getUserByUsername', async () => {
            const dbGetMock = vi.spyOn(db, 'get').mockImplementation((query, params, callback) => {
                callback(new Error('DB error'), null);
            });
            await expect(UserDAO.getUserByUsername('test')).rejects.toThrow('DB error');
            dbGetMock.mockRestore();
        });

        it('handles db errors in getUserById', async () => {
            const dbGetMock = vi.spyOn(db, 'get').mockImplementation((query, params, callback) => {
                callback(new Error('DB error'), null);
            });
            await expect(UserDAO.getUserById(1)).rejects.toThrow('DB error');
            dbGetMock.mockRestore();
        });

        it('handles db errors in addNewUser', async () => {
            const dbRunMock = vi.spyOn(db, 'run').mockImplementation((query, params, callback) => {
                callback(new Error('DB error'), null);
            });
            await expect(UserDAO.addNewUser({
                username: 'test',
                password: 'pass',
                email: 'test@test.com',
                firstName: 'Test',
                lastName: 'User',
                typeId: 1
            })).rejects.toThrow('DB error');
            dbRunMock.mockRestore();
        });

        it('handles db errors in getUnassignedEmployees', async () => {
            const dbAllMock = vi.spyOn(db, 'all').mockImplementation((query, params, callback) => {
                callback(new Error('DB error'), null);
            });
            await expect(UserDAO.getUnassignedEmployees()).rejects.toThrow('DB error');
            dbAllMock.mockRestore();
        });

        it('handles db errors in assignEmployeeToOffice', async () => {
            const dbRunMock = vi.spyOn(db, 'run').mockImplementation((query, params, callback) => {
                callback(new Error('DB error'), null);
            });
            await expect(UserDAO.assignEmployeeToOffice(1, 1, 3)).rejects.toThrow('DB error');
            dbRunMock.mockRestore();
        });

        it('handles db errors in deleteEmployeeById', async () => {
            const dbRunMock = vi.spyOn(db, 'run').mockImplementation((query, params, callback) => {
                callback(new Error('DB error'), null);
            });
            await expect(UserDAO.deleteEmployeeById(1)).rejects.toThrow('DB error');
            dbRunMock.mockRestore();
        });

        it('handles db errors in updateUserProfile', async () => {
            const dbRunMock = vi.spyOn(db, 'run').mockImplementation((query, params, callback) => {
                callback(new Error('DB error'), null);
            });
            await expect(UserDAO.updateUserProfile(1, 'telegram', 1, 'img.png')).rejects.toThrow('DB error');
            dbRunMock.mockRestore();
        });
    });
});
describe('UserDAO - error branches', () => {
  it('getTechnicalOfficers should reject when db.all errors', async () => {
    const dbAllSpy = vi.spyOn(db, 'all').mockImplementation((sql, params, cb) => {
      // simulate DB error
      cb(new Error('simulated db.all failure'), null);
    });

    await expect(UserDAO.getTechnicalOfficers()).rejects.toThrow(/simulated db\.all failure/);

    dbAllSpy.mockRestore();
  });
});
describe('UserDAO - assignEmployeeToOffice external office branch', () => {
  it('rejects when inserting into external_office_employee fails', async () => {
    const dbRunMock = vi.spyOn(db, 'run').mockImplementation((sql, params, cb) => {
      // simulate update success, external insert failure
      if (/UPDATE\s+user/i.test(String(sql))) {
        if (typeof cb === 'function') cb(null);
      } else if (/external_office_employee/i.test(String(sql))) {
        if (typeof cb === 'function') cb(new Error('simulated external insert failure'));
      } else {
        if (typeof cb === 'function') cb(null);
      }
    });

    await expect(UserDAO.assignEmployeeToOffice(12, 5, 6)).rejects.toThrow(/simulated external insert failure/);

    dbRunMock.mockRestore();
  });

  it('resolves when external_office_employee insert succeeds', async () => {
    const dbRunMock = vi.spyOn(db, 'run').mockImplementation((sql, params, cb) => {
      // always succeed
      if (typeof cb === 'function') cb(null);
    });

    await expect(UserDAO.assignEmployeeToOffice(13, 6, 6)).resolves.toBeUndefined();

    dbRunMock.mockRestore();
  });
});
describe('UserDAO - assignOfficerToOffice error branch', () => {
  it('should reject when inserting into office_employee fails (covers return reject(err) in assignOfficerToOffice)', async () => {
    // mock db.run to fail when inserting into office_employee
    const dbRunMock = vi.spyOn(db, 'run').mockImplementation((sql, params, cb) => {
      if (/INSERT\s+INTO\s+office_employee/i.test(String(sql))) {
        if (typeof cb === 'function') cb(new Error('simulated insert office_employee failure'));
      } else {
        if (typeof cb === 'function') cb(null);
      }
    });

    await expect(UserDAO.assignOfficerToOffice(42, 7)).rejects.toThrow(/simulated insert office_employee failure/);

    dbRunMock.mockRestore();
  });
});

describe('UserDAO - updateUserProfile error propagation', () => {
  it('should reject when getUserById fails (covers .catch in updateUserProfile)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const runMock = vi.spyOn(db, 'run').mockImplementation((sql, params, cb) => {
      if (typeof cb === 'function') cb(null);
    });
    // make db.get fail so getUserById rejects
    const getMock = vi.spyOn(db, 'get').mockImplementation((sql, params, cb) => {
      if (typeof cb === 'function') cb(new Error('simulated db.get failure'), null);
    });

    await expect(UserDAO.updateUserProfile(1, '@tg', 1, 'img.png')).rejects.toThrow(/simulated db\.get failure/);

    expect(consoleSpy).toHaveBeenCalled();

    runMock.mockRestore();
    getMock.mockRestore();
    consoleSpy.mockRestore();
  });
});

describe('assignEmployeeToOffice & removeOfficerFromOffice', () => {
  it('assignEmployeeToOffice (roleId 4) writes to office_employee ', async () => {
    const hashed = await bcrypt.hash('pwd_assign_hp', 8);
    const user = {
      username: 'assign_hp_user',
      password: hashed,
      email: 'assign_hp@example.com',
      firstName: 'Assign',
      lastName: 'Happy',
      typeId: 5
    };
    const id = await UserDAO.addNewUser(user);

    await expect(UserDAO.assignEmployeeToOffice(id, 2, 4)).resolves.toBeUndefined();

    const row = await new Promise((res, rej) =>
      db.get('SELECT * FROM office_employee WHERE userId = ?', [id], (err, r) => (err ? rej(err) : res(r)))
    );

    expect(row).toBeTruthy();
    expect(row.userId).toBe(id);
    expect(row.officeId).toBe(2);
  });

  it('assignEmployeeToOffice rejects when INSERT into office_employee fails )', async () => {
    const hashed = await bcrypt.hash('pwd_assign_err', 8);
    const user = {
      username: 'assign_err_user',
      password: hashed,
      email: 'assign_err@example.com',
      firstName: 'Assign',
      lastName: 'Error',
      typeId: 5
    };
    const id = await UserDAO.addNewUser(user);

    vi.spyOn(db, 'run').mockImplementation((sql, params, cb) => {
      if (/INSERT\s+INTO\s+office_employee/i.test(String(sql))) {
        if (typeof cb === 'function') cb(new Error('simulated insert office_employee failure'));
      } else {
        if (typeof cb === 'function') cb(null);
      }
    });

    await expect(UserDAO.assignEmployeeToOffice(id, 3, 4)).rejects.toThrow(/simulated insert office_employee failure/);
  });

  it('removeOfficerFromOffice removes assignment (happy path)', async () => {
    const hashed = await bcrypt.hash('pwd_remove_hp', 8);
    const user = {
      username: 'remove_hp_user',
      password: hashed,
      email: 'remove_hp@example.com',
      firstName: 'Remove',
      lastName: 'Happy',
      typeId: 3
    };
    const id = await UserDAO.addNewUser(user);

    // create assignment
    await new Promise((res, rej) =>
      db.run('INSERT INTO office_employee (officeId, userId) VALUES (?, ?)', [5, id], (e) => (e ? rej(e) : res()))
    );

    await expect(UserDAO.removeOfficerFromOffice(id, 5)).resolves.toBeUndefined();

    const row = await new Promise((res, rej) =>
      db.get('SELECT * FROM office_employee WHERE userId = ? AND officeId = ?', [id, 5], (err, r) => (err ? rej(err) : res(r)))
    );
    expect(row).toBeFalsy();
  });

  it('removeOfficerFromOffice rejects when DELETE fails (covers return reject(err))', async () => {
    const hashed = await bcrypt.hash('pwd_remove_err', 8);
    const user = {
      username: 'remove_err_user',
      password: hashed,
      email: 'remove_err@example.com',
      firstName: 'Remove',
      lastName: 'Error',
      typeId: 3
    };
    const id = await UserDAO.addNewUser(user);

    // create assignment
    await new Promise((res, rej) =>
      db.run('INSERT INTO office_employee (officeId, userId) VALUES (?, ?)', [6, id], (e) => (e ? rej(e) : res()))
    );

    vi.spyOn(db, 'run').mockImplementation((sql, params, cb) => {
      if (/DELETE\s+FROM\s+office_employee/i.test(String(sql))) {
        if (typeof cb === 'function') cb(new Error('simulated delete office_employee failure'));
      } else {
        if (typeof cb === 'function') cb(null);
      }
    });

    await expect(UserDAO.removeOfficerFromOffice(id, 6)).rejects.toThrow(/simulated delete office_employee failure/);
  });
});
