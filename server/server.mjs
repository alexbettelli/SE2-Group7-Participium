import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import session from "express-session";
import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from 'bcrypt';

import DAO from './dao/DAO.mjs';


const app = express();
const PORT = 3001;

app.use(express.json());
app.use(morgan('dev'));

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));

app.use('/public', express.static('public'));


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


app.post("/user", async (req, res) => {
  try {
    const data = req.body;

    const user = await DAO.getUserByUsername(data.username);  
    if (user) return res.status(409).json({ message: "This username already exist" });    
    
    const hashedPassword = await bcrypt.hash(data.password, 8);
    data.password = hashedPassword
    const newUserId = await DAO.addNewUser(data);

    return res.status(201).json(newUserId);
    
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json({error: 'Error: user not saved'});
  }
});

app.post('/employees', async (req, res) => {
  try {
    // verify the request is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!req.user || req.user.typeId !== 2) {  // typeId 2 = admin
      return res.status(403).json({ error: 'Forbidden' });
    }

    const employeeData = req.body;
    const hashedPassword = await bcrypt.hash(employeeData.password, 8);
    employeeData.password = hashedPassword;
    employeeData.typeId = 5; // typeId 5 = unassigned employee
    console.log("Creating new employee with data:", employeeData);
    const created = await DAO.addNewUser(employeeData);

    return res.status(201).json(created);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json({ error: 'Error creating employee' });
  }
});

app.get('/employees/unassigned', async (req, res) => {
  try {
    // verify the request is authenticated
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const employees = await DAO.getUnassignedEmployees();
    return res.status(200).json(employees);
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    res.status(503).json({ error: 'Error fetching employees' });
  }
});

app.post('/session', passport.authenticate('local'), function (req, res){  
  return res.status(201).json(req.user);
});
app.get('/session/current', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else{
    res.status(401).json({error : 'Not authenticate!'});
  }
})
app.delete('/sessions/current', (req, res) => {
  req.logout(() => {
    res.end();
  });
});


app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});