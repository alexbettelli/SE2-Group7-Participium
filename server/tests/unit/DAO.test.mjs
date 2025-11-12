import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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

      Database._categories = [
        { id: 1, name: 'Plumbing' },
        { id: 2, name: 'Electrical'},
        { id: 3, name: 'Landscaping' }
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

        return cb && cb(null, undefined);
      } catch (err) {
        return cb && cb(err);
      }
    }

    all(sql, maybeParams, maybeCb) {
      const { cb } = norm(maybeParams, maybeCb);
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
      const names = categories.map(c => c.name);
      expect(names).toEqual(expect.arrayContaining(['Plumbing', 'Electrical', 'Landscaping']));
      }
    )
  })
});