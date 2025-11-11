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
import { Report } from './model/model.mjs';
import * as errors from './model/error.mjs';
import addFormats from 'ajv-formats'

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

passport.deserializeUser( function( user, cb){
  cb(null, user);
});

app.use(passport.authenticate('session'));

export const isLogged = (req, res, next) => {
  if(req.isAuthenticated()) return next();
  else return res.status(401).json(new errors.UnauthorizedError());
}


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

    if (!req.user || req.user.typeId !== 2) {  // typeId 2 = admin
      return res.status(403).json({ error: 'Forbidden' });
    }

    const employee = await DAO.getUserByUsername(req.body.username);  
    if (employee) return res.status(409).json({ error: 'This username already exists.' }); 

    const employeeData = req.body;
    const hashedPassword = await bcrypt.hash(employeeData.password, 8);
    employeeData.password = hashedPassword;
    employeeData.typeId = 5; // typeId 5 = unassigned employee
    console.log("Creating new employee with data:", employeeData);
    const created = await DAO.addNewUser(employeeData);

    return res.status(201).json(created);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json({ error: error.message });
  }
});

app.get('/employees/unassigned', isLogged,async (req, res) => {
  try {
    if (!req.user || req.user.typeId !== 2) {  // typeId 2 = admin
      return res.status(403).json({ error: 'Forbidden' });
    }

    const employees = await DAO.getUnassignedEmployees();
    return res.status(200).json(employees);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json({ error: 'Error fetching employees' });
  }
});

app.post('/employees/assign', isLogged, async (req, res) => {
  try {
    if (!req.user || req.user.typeId !== 2) {  // typeId 2 = admin
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { employeeId, officeId, roleId } = req.body;
    console.log(`Assigning employee ${employeeId} to office ${officeId} with role ${roleId}`);
    await DAO.assignEmployeeToOffice(employeeId, officeId, roleId);
    return res.status(200).json({ message: 'Employee assigned successfully' });
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json({ error: 'Error assigning employee' });
  }
});

app.get('/offices', isLogged, async (req, res) => {
  try {
    if (!req.user || req.user.typeId !== 2) {  // typeId 2 = admin
      return res.status(403).json({ error: 'Forbidden' });
    }

    const offices = await DAO.getOffices();
    return res.status(200).json(offices);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json({ error: 'Error fetching offices' });
  }
});

app.get('/roles', isLogged, async (req, res) => {
  try {
    if (!req.user || req.user.typeId !== 2) {  // typeId 2 = admin
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const roles = await DAO.getRoles();
    return res.status(200).json(roles);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json({ error: 'Error fetching roles' });
  }
});

app.post('/session', passport.authenticate('local'), function (req, res){  
  return res.status(201).json(req.user);
});

app.get('/session/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else{
    res.status(401).json(new errors.UnauthorizedError());
  }
})

app.delete('/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});

// REPORTS

app.post('/reports', isLogged, upload.array('images', 3), validate({ body: schemas.report }), async (req, res) => {
  const images = req.files;
  
  if(images.length === 0) return res.status(400).json(new errors.BadRequestError());

  const uuids = images.map(image => {
    const extension = image.originalname.split('.').at(-1);
    return `${uuidv4()}.${extension}`
  })

  const report = new Report({
      title: req.body.title,
      description: req.body.description,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
      address: req.body.address,
      userId: req.user.id,
      catId: req.body.catId,
      images: uuids,
  });

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
    return res.status(500).json(new errors.InternalServerError());
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