import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';

const app = express();

app.use(express.json());
app.use(morgan('dev'));

const corsOptions = {
  origin: "http://localhost:5173",
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));

app.use('/public', express.static('public'));

const PORT = 3001;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});