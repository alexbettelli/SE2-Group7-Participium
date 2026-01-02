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
import UserDAO from './dao/UserDAO.mjs';
import GenericInfoDAO from './dao/GenericInfoDAO.mjs';
import NotificationDAO from './dao/NotificationDAO.mjs';
import ReportDAO from './dao/ReportDAO.mjs';
import otpGenerator from 'otp-generator';
import dayjs from 'dayjs';
import nodemailer from 'nodemailer';
import juice from 'juice';
import Handlebars from 'handlebars';
import './telegramBot/bot.mjs';
import jwt from 'jsonwebtoken';

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
validator.ajv.addSchema(schemas.comment, 'comment');
addFormats(validator.ajv);
const validate = validator.validate;

const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const CORS_ORIGIN = process.env.CORS_ORIGIN || `http://localhost:5173`;
const OTP_EXPIRATION_MINUTES = process.env.OTP_EXPIRATION_MINUTES || 30;
const UPLOADS_DIR = process.env.UPLOADS_DIR || 'uploads';

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_prod';
const JWT_EXPIRES_IN = '1h'; 

app.use(express.json());
app.use(morgan('dev'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/images', express.static(path.join(__dirname, UPLOADS_DIR)));

const corsOptions = {
  origin: CORS_ORIGIN,
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));

const upload = multer();
const upload_dir = UPLOADS_DIR;

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, UPLOADS_DIR, 'profiles');
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

app.use(session({
  secret: 'Participium!',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    secure: false
  } // 1 day
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(async (username, password, cb) => {

    const userInfo = await UserDAO.getUserByUsername(username);

    if (!userInfo) return cb(null, false, 'Username incorrect or not found');

    const match = await bcrypt.compare(password, userInfo.password);
    if (!match) return cb(null, false, 'Password incorrect');

    return cb(null, userInfo.user);
  })
);

passport.serializeUser(function (user, cb) {
  cb(null, user);
});

passport.deserializeUser(async function (user, cb) {
  try {
    const freshUser = await UserDAO.getUserById(user.id);
    if (freshUser) {
      const userWithImageUrl = {
        ...freshUser,
        imageUrl: freshUser.imageUrl
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
  if (req.isAuthenticated()) 
    return next();
  const authHeader = req.header('Authorization') || req.header('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change_this_in_prod');
      req.user = decoded; //now the routes have still access to the req.user value
      return next();
    } catch (err) {
      return res.status(401).json(new errors.UnauthorizedError());
    }
  }

  return res.status(401).json(new errors.UnauthorizedError());
}

//middleware to check if the user is a citizen (typeId === 1)
const isCitizen = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role.id === 1) {
    return next();
  }
  return res.status(403).json(new errors.ForbiddenError("Access restricted to citizens only."));
};

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: "participium.g7@gmail.com",
      pass: 'rvht crky jvnb xaqy'
    }
});

const templatePath = path.join(__dirname, 'emails', 'email.hbs');
const stylePath = path.join(__dirname, 'emails', 'email.css');
const templateContent = fs.readFileSync(templatePath, 'utf-8');
const cssContent = fs.readFileSync(stylePath, 'utf-8');
const template = Handlebars.compile(templateContent);

const sendEmail = async (email, username, fullName, otp) => {
  const emailData = {
    username: username,
    fullName: fullName,
    otp: otp.split('')
  };

  const mailOptions = {
    from: "participium.g7@gmail.com",
    to: email,
    subject: "Participium account creation",
    html: juice.inlineContent(template(emailData), cssContent)
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email: ' + error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

const otpGeneration = async (req, res) => {
  if(!req.session.tempUser) return res.status(400).json(new errors.BadRequestError("No temporary user data found. Please register first."));
  
  try {
    const data = req.session.tempUser;
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: true,
      lowerCaseAlphabets: false,
      digits: true,
      specialChars: false
    });
    const hashedOtp = await bcrypt.hash(otp, 8);
    const expiresAt = dayjs().add(OTP_EXPIRATION_MINUTES, 'minutes').toDate();
    req.session.otp = { code: hashedOtp, expiresAt };
    sendEmail(data.email, data.username, `${data.firstName} ${data.lastName}`, otp)
    res.status(201).json({ message: 'OTP generated and sent to email.' });
  } catch (error) {
    console.error('Error generating OTP: ' + error);
    return res.status(500).json(new errors.InternalServerError("Error generating OTP."));
  }

};

app.post("/users/temporary", async (req, res, next) => {
  console.log(req.session.tempUser, req.session.otp);
  if(req.session.otp){
    if(dayjs().isBefore(dayjs(req.session.otp.expiresAt))){
      return res.status(400).json(new errors.BadRequestError("An OTP has already been generated and is still valid."));
    }
  }

  try {
    const data = req.body;
    const found = await UserDAO.checkUserExists(data.username, data.email);
    if (found) return res.status(409).json(new errors.ConflictError("This user already exists."));
    const hashedPassword = await bcrypt.hash(data.password, 8);
    data.password = hashedPassword;
    req.session.tempUser = data;
    next();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError("Unable to save the user."));
  }
}, otpGeneration);

app.post("/otp/resend", (req, res, next) => {
  console.log(req.session.tempUser);
  if(!req.session.tempUser) return res.status(400).json(new errors.BadRequestError("No temporary user data found. Please register first."));
  if(req.session.otp){
    const createdAt = dayjs(req.session.otp.expiresAt).subtract(OTP_EXPIRATION_MINUTES, 'minutes');
    const resendableAt = createdAt.add(1, 'minutes');
    if(dayjs().isAfter(resendableAt)) next();
    else return res.status(400).json(new errors.BadRequestError("You can request a new OTP only after 1 minute from the previous generation."));
  }else next();
}, otpGeneration);

app.post('/users/temporary/verify', async (req, res) => {
  if(!req.session.otp || !req.session.tempUser) return res.status(400).json(new errors.BadRequestError("No OTP found. Please generate a new one."));
  const { code, expiresAt } = req.session.otp;
  const { otp } = req.body;
  const match = await bcrypt.compare(otp, code);
  if (!match || dayjs().isAfter(dayjs(expiresAt))) {
    return res.status(400).json(new errors.BadRequestError("The OTP is invalid or has expired."));
  }
  
  try {
    const newUserId = await UserDAO.addNewUser(req.session.tempUser);
    delete req.session.tempUser;
    delete req.session.otp;
    return res.status(201).json(newUserId);
  } catch(error){
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError("Unable to save the user."));
  }
  
  
});


app.post('/employees', isLogged, async (req, res) => {
  try {

    if (!req.user || req.user.role.id !== 2) {  // typeId 2 = admin
      return res.status(403).json(new errors.ForbiddenError());
    }

    const employee = await UserDAO.getUserByUsername(req.body.username);
    if (employee) return res.status(409).json(new errors.ConflictError("This username already exists."));

    const employeeData = req.body;
    const hashedPassword = await bcrypt.hash(employeeData.password, 8);
    employeeData.password = hashedPassword;
    employeeData.typeId = 5; // typeId 5 = unassigned employee
    const created = await UserDAO.addNewUser(employeeData);

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
    if (!employeeId || isNaN(employeeId)) {
      return res.status(400).json(new errors.BadRequestError("Employee ID is required."));
    }

    

    const username = await UserDAO.getUserById(employeeId);
    if (!username) {
      return res.status(404).json(new errors.BadRequestError("Employee not found."));
    }
    await UserDAO.deleteEmployeeById(employeeId);
    return res.status(200).json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.get('/employees/unassigned', isLogged, async (req, res) => {
  try {
    if (!req.user || req.user.role.id !== 2) {  // typeId 2 = admin
      return res.status(403).json(new errors.ForbiddenError());
    }

    const employees = await UserDAO.getUnassignedEmployees();
    return res.status(200).json(employees);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.get('/employees/technical-officers', isLogged, async (req, res) => {
  try {
    if (!req.user || req.user.role.id !== 2) {  // typeId 2 = admin
      return res.status(403).json(new errors.ForbiddenError());
    }

    const officers = await UserDAO.getTechnicalOfficers();
    return res.status(200).json(officers);
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
    await UserDAO.assignEmployeeToOffice(employeeId, officeId, roleId);
    return res.status(200).json({ message: 'Employee assigned successfully' });
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.post('/employees/technical-officers/assign', isLogged, async (req, res) => {
  try {
    if (!req.user || req.user.role.id !== 2) {  // typeId 2 = admin
      return res.status(403).json(new errors.ForbiddenError());
    }
    const { officerId, officeId } = req.body;
    await UserDAO.assignOfficerToOffice(officerId, officeId);
    return res.status(200).json({ message: 'Officer assigned successfully' });
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.delete('/employees/technical-officers/remove', isLogged, async (req, res) => {
  try {
    if (!req.user || req.user.role.id !== 2) {  // typeId 2 = admin
      return res.status(403).json(new errors.ForbiddenError());
    }
    const { officerId, officeId } = req.body;
    await UserDAO.removeOfficerFromOffice(officerId, officeId);
    return res.status(200).json({ message: 'Officer removed successfully' });
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

    const offices = await GenericInfoDAO.getOffices();
    return res.status(200).json(offices);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.get('/externalOffices', isLogged, async (req, res) => {
  try {
    const externalOffices = await GenericInfoDAO.getExternalOffices();
    return res.status(200).json(externalOffices);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.get('/roles', isLogged, async (req, res) => {
  try {
    if (!req.user || req.user.role.id !== 2) {  // typeId 2 = admin
      return res.status(403).json(new errors.ForbiddenError());
    }

    const roles = await GenericInfoDAO.getRoles();
    return res.status(200).json(roles);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.get('/categories', isLogged, async (req, res) => {
  try {
    const categories = await GenericInfoDAO.getCategories();
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
app.get('/reports', isLogged, async (req, res) => {
  try {
    const reports = await ReportDAO.getAllReports();
    return res.status(200).json(reports);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.get('/users/myreports', isLogged, async (req, res) => {
  try {
    const userId = req.user.id;
    const reports = await ReportDAO.getReportsByUserId(userId);
    return res.status(200).json(reports);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});


app.get('/reports/unassigned', isLogged, async (req, res) => {
  if (req.user.role.id !== 3) return res.status(403).json(new errors.ForbiddenError());
  try {
    const reports = await ReportDAO.getUnassignedReports();
    return res.status(200).json(reports);
  } catch (ex) {
    return res.status(500).json(new errors.InternalServerError());
  }
});

// Route 1: Report assegnati all'office (da accettare)
app.get("/reports/external-office-assigned", isLogged, async (req, res) => {
  if (req.user.role.id !== 6) return res.status(403).json(new errors.ForbiddenError());
  try {
    const reports = await ReportDAO.getExternalOfficeAssignedReports(req.user.id);
    return res.status(200).json(reports);
  } catch (ex) {
    console.error(`ERROR: ${ex.message}`);
    return res.status(500).json(new errors.InternalServerError());
  }
});

// Route 2: Report accettati dal maintainer
app.get("/reports/external-maintainer-my", isLogged, async (req, res) => {
  if (req.user.role.id !== 6) return res.status(403).json(new errors.ForbiddenError());
  try {
    const reports = await ReportDAO.getExternalMaintainerMyReports(req.user.id);
    console.log("Il server ritorna: " + reports);
    return res.status(200).json({reports: reports});
  } catch (ex) {
    console.error(`ERROR: ${ex.message}`);
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.get("/reports/assigned", isLogged, async (req, res) => {
  if (req.user.role.id !== 4) return res.status(403).json(new errors.ForbiddenError());
  try {
    const reports = await ReportDAO.getAssignedReports(req.user.id);
    return res.status(200).json(reports);
  } catch (ex) {
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.get("/reports/statuses", isLogged, async (req, res) => {
  try {
    const statuses = await GenericInfoDAO.getReportStatuses();
    return res.status(200).json(statuses);
  } catch (e) {
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.patch("/reports/external-maintainer/:id", isLogged, async (req, res) => {
  if (req.user.role.id !== 6) return res.status(403).json(new errors.ForbiddenError());
  try {
    const result = await ReportDAO.updateExternalMaintainerReportStatus(
      req.user.id, 
      req.params.id, 
      req.query.statusId
    );
    if (!result)
      return res.status(404).json(new errors.NotFoundError("Report not found."));
    return res.status(200).json({ 
      ok: true, 
      notification: result?.notification ?? null, 
      comment: result?.comment ?? null 
    });
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.post('/reports/assign', isLogged, async (req, res) => {
  if (req.user.role.id !== 3) return res.status(403).json(new errors.ForbiddenError());
  try {
    const { reportId, userId, categoryId, officeId, officerId } = req.body;
    await ReportDAO.assignReportToOfficer(reportId, categoryId, officeId, officerId, userId);
    
    return res.status(200).json();
  } catch (err) {
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.post('/reports/assignExternal', isLogged, async (req, res) => {
  if (req.user.role.id !== 4) return res.status(403).json(new errors.ForbiddenError());
  try {
    const { reportId, externalOfficeId } = req.body;
    await ReportDAO.assignReportToExternalOffice(reportId, externalOfficeId);
    return res.status(200).json();
  } catch (err) {
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.post('/reports/reject', isLogged, async (req, res) => {
  if (req.user.role.id !== 3) return res.status(403).json(new errors.ForbiddenError());
  try {
    const { reportId, userId, reason } = req.body;
    await ReportDAO.rejectReport(reportId, userId, reason);    
    return res.status(200).json();
  }
  catch (err) {
    return res.status(500).json(new errors.InternalServerError());
  }
});

app.post('/users/reports', isLogged, upload.array('images', 3), validate({ body: schemas.report }), async (req, res) => {
  const images = req.files;

  if (images.length === 0) return res.status(400).json(new errors.BadRequestError());

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

  try {
    const received = await ReportDAO.addNewReport(report);
    for (const idx in images) {
      const directory = `${upload_dir}/reports/${received.id}`;
      if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(__dirname, directory, uuids[idx]), images[idx].buffer);
    }
    return res.status(201).json({ reportId: received.id, createdAt: received.createdAt, images: uuids.map(filename => ({ imageUrl: `${BASE_URL}/images/reports/${received.id}/${filename}` })) });
  } catch (e) {
    return res.status(503).json(new errors.ServiceUnvailableError());
  }

});

//PUT /api/user/profile
app.put('/api/user/profile', isLogged, isCitizen, uploadProfile.single('profilePhoto'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { telegramUsername, allowEmailNotification } = req.body;

    const currentUser = await UserDAO.getUserById(userId);
    const oldImageUrl = currentUser.imageUrl;

    let filename = oldImageUrl;

    if (req.file) {
      const extension = req.file.originalname.split('.').pop();
      filename = `${uuidv4()}.${extension}`;

      const directory = path.join(__dirname, UPLOADS_DIR, 'profiles');
      if (!fsSync.existsSync(directory)) fsSync.mkdirSync(directory, { recursive: true });
      fsSync.writeFileSync(path.join(directory, filename), req.file.buffer);

      if (oldImageUrl) {
        const filename = oldImageUrl.includes('/') ? oldImageUrl.split('/').pop() : oldImageUrl;
        const oldPhotoPath = path.join(__dirname, UPLOADS_DIR, 'profiles', filename);
        try {
          await fsPromises.unlink(oldPhotoPath);
        } catch (err) {
          console.error(`Error deleting old profile photo: ${err.message}`);
        }
      }
    }

    await UserDAO.updateUserProfile(
      userId,
      telegramUsername || null,
      allowEmailNotification === '1' || allowEmailNotification === 'true' ? 1 : 0,
      filename
    );

    const updatedUser = await UserDAO.getUserById(userId);

    const userResponse = {
      ...updatedUser,
      imageUrl: updatedUser.imageUrl
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

    const currentUser = await UserDAO.getUserById(userId);
    const oldImageUrl = currentUser.imageUrl;

    if (oldImageUrl) {
      const filename = oldImageUrl.includes('/') ? oldImageUrl.split('/').pop() : oldImageUrl;
      const oldPhotoPath = path.join(__dirname, UPLOADS_DIR, 'profiles', filename);
      try {
        await fsPromises.unlink(oldPhotoPath);
      } catch (err) {
        console.error(`Error deleting profile photo: ${err.message}`);
      }

      await UserDAO.updateUserProfile(userId, null, null, null);
    }

    res.status(200).json({ message: 'Profile photo deleted successfully' });
  } catch (err) {
    console.error('Error deleting profile photo:', err);
    res.status(500).json(new errors.InternalServerError("Failed to delete profile photo."));
  }
});

app.patch("/reports/:id", isLogged, async (req, res) => {
  if (req.user.role.id !== 4) return res.status(403).json(new errors.ForbiddenError());
  try {
    const notification = await ReportDAO.updateReportStatus(req.user.id, req.params.id, req.query.statusId);
    if (!notification)
      return res.status(404).json(new errors.NotFoundError("Report not found or not assigned to you."));
    return res.status(200).json({ ok: true, notification });
  } catch (e) {
    return res.status(500).json(new errors.InternalServerError());
  }
});

//NOTIFICATIONS

app.post('/notifications', validate({ body: schemas.notification }), async (req, res) => {
  try {
    const message = req.body;
    const fullMessage = await NotificationDAO.createNotification(message);
    return res.status(201).json(fullMessage);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.post('/notifications/read', isLogged, async (req, res) => {
  const { reportId } = req.body;
  const userId = req.user.id;
  let readNotifications = 0;
  if (!reportId || !userId) {
    return res.status(400).json(new errors.BadRequestError("Missing reportId or userId"));
  }
  try {
    readNotifications = await NotificationDAO.setNotificationsAsRead(userId, reportId);
    res.status(201).json({ success: true, readNotifications });
  } catch (err) {
    res.status(500).json(new errors.InternalServerError());
  }
});


//COMMENTS

app.post('/comments', isLogged, validate({ body: schemas.comment }),async (req, res) => { 
  try {
    const message = req.body;
    const fullMessage = await NotificationDAO.createComment(message);
    return res.status(201).json(fullMessage);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    return res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.post('/comments/read', isLogged, async (req, res) => {
  const { reportId } = req.body;
  const userId = req.user.id;
  let readComments = 0;
  if (!reportId || !userId) {
    return res.status(400).json(new errors.BadRequestError("Missing reportId or userId"));
  }
  try {
    readComments = await NotificationDAO.setCommentsAsRead(userId, reportId);
    res.status(201).json({ success: true, readComments });
  } catch (err) {
    res.status(500).json(new errors.InternalServerError());
  }
});




app.post('/bot/verify/username', async (req, res) => {
  try {
    const { telegramUsername } = req.body;
    
    if (!telegramUsername) {
      return res.status(400).json(new errors.BadRequestError("Telegram username is required"));
    }

    const username = await UserDAO.getUsernameByTelegramUsername(telegramUsername);
    
    if (!username) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ritorna solo i dati necessari (NO password)
    return res.status(200).json({username : username});
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});

app.post('/bot/verify/password', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json(new errors.BadRequestError("Username and password are required"));
    }

    const userInfo = await UserDAO.getUserByUsername(username);
    
    if (!userInfo) {
      return res.status(401).json({ valid: false });
    }

    const match = await bcrypt.compare(password, userInfo.password);
    
    if (!match) {
      return res.status(401).json({ valid: false });
    }

    const payload = { id: userInfo.user.id, username: userInfo.user.username, role: userInfo.user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }); //generates the JWT 

    return res.status(200).json({
      valid: true,
      user: userInfo.user,
      token
    });
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json(new errors.ServiceUnvailableError());
  }
});
app.listen(PORT, () => {
  console.log(`Server listening at ${BASE_URL}`);
  console.log(`Swagger documentation is available at ${BASE_URL}/api-docs`);
});


app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    res.status(400).json(new errors.BadRequestError());
  }
  next(err);
})

export default app;