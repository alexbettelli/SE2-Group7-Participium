import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from 'bcrypt';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { Validator, ValidationError } from 'express-json-validator-middleware';
import { fileURLToPath } from 'url';
import DAO from './dao/DAO.mjs';
import * as errors from './model/error.mjs';
import addFormats from 'ajv-formats'
import fsPromises from 'fs/promises';
import fsSync from 'fs';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const swaggerDocument = JSON.parse(fs.readFileSync('./swagger.json', 'utf-8'));
const validator = new Validator({ allErrors: true });
const schemas = swaggerDocument.components.schemas;
validator.ajv.addSchema(schemas.user, 'user');
validator.ajv.addSchema(schemas.report, 'report');
validator.ajv.addSchema(schemas.notification, 'notification');
addFormats(validator.ajv);
const validate = validator.validate;

app.use(express.json());
app.use(morgan('dev'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/images', express.static(path.join(__dirname, 'uploads')));

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));

app.use('/public', express.static('public'));

const PORT = 3001;

const upload = multer();
const upload_dir = 'uploads';

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'profiles');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const uploadProfile = multer({
  storage: multer.memoryStorage(), 
  limits: { 
    fileSize: 5 * 1024 * 1024,  
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  console.log(`Swagger documentation is available at http://localhost:${PORT}/api-docs`);
});

app.use(session({
  secret: 'Participium!',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(async (username, password, cb) => {

    const userInfo = await DAO.getUserByUsername(username);
  
    if (!userInfo) return cb(null, false, 'Username incorrect or not found');

    const match = await bcrypt.compare(password, userInfo.password);
    if (!match) return cb(null, false, 'Password incorrect');
    
    return cb(null, userInfo.user);    
  })  
);

passport.serializeUser( function( user, cb){
  cb(null, user);
});

passport.deserializeUser(async function(user, cb){
  try {
    const freshUser = await DAO.getUserById(user.id);
    if (freshUser) {
      const userWithImageUrl = {
        ...freshUser,
        imageUrl: freshUser.imageUrl ? `http://localhost:3001/images/profiles/${freshUser.imageUrl}` : null
      };
      return cb(null, userWithImageUrl);
    }
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});

app.use(passport.authenticate('session'));

export const isLogged = (req, res, next) => {
  if(req.isAuthenticated()) return next();
  else return res.status(401).json(new errors.UnauthorizedError());
}

//middleware to check if the user is a citizen (typeId === 1)
const isCitizen = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role.id === 1) {
    return next();
  }
  return res.status(403).json(new errors.ForbiddenError("Access restricted to citizens only."));
};

app.post("/user", async (req, res) => {
  try {
    const data = req.body;

    const user = await DAO.getUserByUsername(data.username);  
    if (user) return res.status(409).json(new errors.ConflictError("This username already exists."));    
    
    const hashedPassword = await bcrypt.hash(data.password, 8);
    data.password = hashedPassword
    const newUserId = await DAO.addNewUser(data);

    return res.status(201).json(newUserId);
    
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError("Unable to save the user."));
  }
  
  
});


app.post('/employees', isLogged,async (req, res) => {
  try {

    if (!req.user || req.user.role.id !== 2) {  // typeId 2 = admin
      return res.status(403).json(new errors.ForbiddenError());
    }

    const employee = await DAO.getUserByUsername(req.body.username);  
    if (employee) return res.status(409).json(new errors.ConflictError("This username already exists.")); 

    const employeeData = req.body;
    const hashedPassword = await bcrypt.hash(employeeData.password, 8);
    employeeData.password = hashedPassword;
    employeeData.typeId = 5; // typeId 5 = unassigned employee
    console.log("Creating new employee with data:", employeeData);
    const created = await DAO.addNewUser(employeeData);

    return res.status(201).json(created);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.delete('/employees/:id', isLogged, async (req, res) => {
  try {
    if (!req.user || req.user.role.id !== 2) {  // typeId 2 = admin
      return res.status(403).json(new errors.ForbiddenError());
    }
    const employeeId = req.params.id;
    if (!employeeId) {
      return res.status(400).json(new errors.BadRequestError("Employee ID is required."));
    }
    
    const username = await DAO.getUserById(employeeId);
    if (!username) {
      return res.status(400).json(new errors.BadRequestError("Employee not found."));
    }
    await DAO.deleteEmployeeById(employeeId);
    return res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.get('/employees/unassigned', isLogged,async (req, res) => {
  try {
    if (!req.user || req.user.role.id !== 2) {  // typeId 2 = admin
      return res.status(403).json(new errors.ForbiddenError());
    }

    const employees = await DAO.getUnassignedEmployees();
    return res.status(200).json(employees);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});


app.post('/employees/assign', isLogged, async (req, res) => {
  try {
    if (!req.user || req.user.role.id !== 2) {  // typeId 2 = admin
      return res.status(403).json(new errors.ForbiddenError());
    }

    const { employeeId, officeId, roleId } = req.body;
    console.log(`Assigning employee ${employeeId} to office ${officeId} with role ${roleId}`);
    await DAO.assignEmployeeToOffice(employeeId, officeId, roleId);
    return res.status(200).json({ message: 'Employee assigned successfully' });
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.get('/offices', isLogged, async (req, res) => {
  try {
    if (!req.user || req.user.role.id !== 2 && req.user.role.id !== 3) {  // typeId 2 = admin, typeId 3 = PR officer
      return res.status(403).json(new errors.ForbiddenError());
    }

    const offices = await DAO.getOffices();
    return res.status(200).json(offices);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.get('/roles', isLogged, async (req, res) => {
  try {
    console.log(req.user);
    if (!req.user || req.user.role.id !== 2) {  // typeId 2 = admin
      return res.status(403).json(new errors.ForbiddenError());
    }
    
    const roles = await DAO.getRoles();
    return res.status(200).json(roles);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.get('/categories', isLogged, async (req, res) => {
  try {
    const categories = await DAO.getCategories();
    return res.status(200).json(categories);
  }
  catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.post('/session', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err); 
    if (!user) {
      return res.status(401).json(new errors.UnauthorizedError()); 
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(201).json(req.user);
    });
  })(req, res, next);
});

app.get('/session/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user); 
  } else {
    res.status(401).json(new errors.UnauthorizedError());
  }
})

app.delete('/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});




// REPORTS

app.get('/users/myreports', isLogged, async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await DAO.getReportsByUserId(userId);
    console.log(reports);
    return res.status(200).json(reports);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.get('/reports/unassigned', isLogged, async (req, res) => {
  if(req.user.role.id !== 3) return res.status(403).json(new errors.ForbiddenError());
  try {
    const reports = await DAO.getUnassignedReports();
    return res.status(200).json(reports);
  }catch(ex){
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.post('/reports/assign', isLogged, async (req, res) => {
  if(req.user.role.id !== 3) return res.status(403).json(new errors.ForbiddenError());
  try {
    const { reportId, userId, categoryId, officeId, officerId } = req.body;
    await DAO.assignReportToOfficer(reportId, categoryId, officeId, officerId);
    await DAO.createNotification({
      reportId: reportId,
      senderId: null,
      receiverId: userId,
      text: `Your report has been approved, we will keep you updated.`,
      channelId: 1,
    });
    return res.status(200).json();
  } catch(err){
    console.log(err);
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.post('/reports/reject', isLogged, async (req, res) => {
  if(req.user.role.id !== 3) return res.status(403).json(new errors.ForbiddenError());
  try {
    const { reportId, userId, reason } = req.body;
    await DAO.rejectReport(reportId, userId, reason);
    await DAO.createNotification({
      reportId: reportId,
      senderId: null,
      receiverId: userId,
      text: `Your report has been rejected. \n Reason: ${reason}`,
      channelId: 1,
    });
    return res.status(200).json();
  }
  catch(err){
    console.log(err);
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.post('/users/reports', isLogged, upload.array('images', 3), validate({ body: schemas.report }), async (req, res) => {
  const images = req.files;
  
  if(images.length === 0) return res.status(400).json(new errors.BadRequestError());

  const uuids = images.map(image => {
    const extension = image.originalname.split('.').at(-1);
    return `${uuidv4()}.${extension}`
  })

  const report = {
      title: req.body.title,
      description: req.body.description,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      address: req.body.address,
      userId: req.user.id,
      catId: req.body.catId,
      images: uuids,
      anonymous: req.body.anonymous === 'true' ? 1 : 0,
  };

  try{
    const received = await DAO.addNewReport(report);
    console.log(received);
    console.log(images);
    for(const idx in images){
      const directory = `${upload_dir}/reports/${received.id}`;
      if(!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(__dirname, directory, uuids[idx]), images[idx].buffer);
    }
    return res.status(201).json({ reportId: received.id, createdAt: received.createdAt, images: uuids.map(filename => ({imageUrl:  `http://localhost:3001/images/reports/${received.id}/${filename}`})) });
  }catch(e){
    console.log(e)
    return res.status(503).json(new errors.ServiceUnvailableError());
  }
      
});

//PUT /api/user/profile
app.put('/api/user/profile', isLogged, isCitizen, uploadProfile.single('profilePhoto'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { telegramUsername, allowEmailNotification } = req.body;
    
    const currentUser = await DAO.getUserById(userId);
    const oldImageUrl = currentUser.imageUrl;
    
    let filename = oldImageUrl;
    
    if (req.file) {
      const extension = req.file.originalname.split('.').pop();
      filename = `${uuidv4()}.${extension}`;
      
      const directory = path.join(__dirname, 'uploads', 'profiles');
      if (!fsSync.existsSync(directory)) fsSync.mkdirSync(directory, { recursive: true });
      fsSync.writeFileSync(path.join(directory, filename), req.file.buffer);
      
      if (oldImageUrl) {
        const oldPhotoPath = path.join(__dirname, 'uploads', 'profiles', oldImageUrl);
        try {
          await fsPromises.unlink(oldPhotoPath);
          console.log(`Deleted old profile photo: ${oldPhotoPath}`);
        } catch (err) {
          console.error(`Error deleting old profile photo: ${err.message}`);
        }
      }
    }

    await DAO.updateUserProfile(
      userId,
      telegramUsername || null,
      allowEmailNotification === '1' || allowEmailNotification === 'true' ? 1 : 0,
      filename
    );

    const updatedUser = await DAO.getUserById(userId);
    
    const userResponse = {
      ...updatedUser,
      imageUrl: updatedUser.imageUrl ? `http://localhost:3001/images/profiles/${updatedUser.imageUrl}` : null
    };
    
    res.status(200).json(userResponse);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json(new errors.InternalServerError("Failed to update profile."));
  }
});

// DELETE /api/user/profile/photo - Remove profile photo
app.delete('/api/user/profile/photo', isLogged, isCitizen, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const currentUser = await DAO.getUserById(userId);
    const oldImageUrl = currentUser.imageUrl; 
    
    if (oldImageUrl) {
      const oldPhotoPath = path.join(__dirname, 'uploads', 'profiles', oldImageUrl);
      try {
        await fsPromises.unlink(oldPhotoPath);
        console.log(`Deleted profile photo: ${oldPhotoPath}`);
      } catch (err) {
        console.error(`Error deleting profile photo: ${err.message}`);
      }
      
      await DAO.updateUserProfile(userId, null, null, null);
    }
    
    res.status(200).json({ message: 'Profile photo deleted successfully' });
  } catch (err) {
    console.error('Error deleting profile photo:', err);
    res.status(500).json(new errors.InternalServerError("Failed to delete profile photo."));
  }
}); 

app.get("/reports/assigned", isLogged, async (req, res) => {
  if(req.user.role.id !== 4) return res.status(403).json(new errors.ForbiddenError());
  try {
    const reports = await DAO.getAssignedReports(req.user.id);
    return res.status(200).json(reports);
  }catch(ex){
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.patch("/reports/:id", isLogged, async (req, res) => {
  if(req.user.role.id !== 4) return res.status(403).json(new errors.ForbiddenError());
  try {
    const result = await DAO.updateReportStatus(req.user.id, req.params.id, req.query.statusId);
    if(!result) return res.status(404).json(new errors.NotFoundError("Report not found or not assigned to you."));
    return res.status(200).json({ message: "Report status updated successfully." });
  } catch(e) {
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.get("/reports/statuses", isLogged, async (req, res) => {
  try {
    const statuses = await DAO.getReportStatuses();
    return res.status(200).json(statuses);
  } catch(e) {
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.get("/reports/unassigned", isLogged, async (req, res) => {
  if(req.user.role.id !== 3) return res.status(403).json(new errors.ForbiddenError());
  try {
    const reports = await DAO.getUnassignedReports();
    return res.status(200).json(reports);
  }catch(err){
    console.log(err);
    return res.status(500).json(new errors.InternalServerError());
  }
});

//NOTIFICATIONS

app.post('/notifications', validate({ body: schemas.notification }), async (req, res) => {
  try {
    const message = req.body;
    const fullMessage = await DAO.createNotification(message);
    return res.status(201).json(fullMessage);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.post('/notifications/read', async (req, res) => {
  const { reportId } = req.body;
  const userId = req.user.id;
  let readNotifications = 0;
  if (!reportId || !userId) {
    return res.status(400).json(new errors.BadRequestError("Missing reportId or userId"));
  }
  try {
    readNotifications = await DAO.setNotificationsAsRead(userId, reportId);
    res.status(201).json({ success: true, readNotifications });
  } catch (err) {
    res.status(500).json(new errors.InternalServerError());
  }
});





app.use((err, req, res, next) => {
  if(err instanceof ValidationError){
    console.log(err.validationErrors);
    res.status(400).json(new errors.BadRequestError());
  }
  next(err);
})

export default app;