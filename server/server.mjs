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
import { fileURLToPath } from 'url';
import DAO from './dao/DAO.mjs';
import { Report } from './model/model.mjs';


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(morgan('dev'));
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

const isLogged = (req, res, next) => {
  if(req.isAuthenticated()) return next();
  else return res.status(401).json({ "message": "Not authenticated" });
}


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

// REPORTS

app.post('/reports', isLogged, upload.array('images', 3), async (req, res) => {
  console.log(req.body);
  const images = req.files;
  
  if(images.length == 0) return res.status(400).json({ "message": "Number of images not valid." });
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
    console.log(images);
    for(const idx in images){
      const directory = `${upload_dir}/reports/${received.id}`;
      if(!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(path.join(__dirname, directory, uuids[idx]), images[idx].buffer);
    }
    return res.status(201).json({ reportId: received.id });
  }catch(e){
    console.log(e)
    return res.status(500).end();
  }
      
});