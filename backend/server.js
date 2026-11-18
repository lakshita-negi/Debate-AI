
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { WebSocketServer } = require('ws');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const debateRoutes = require('./src/routes/debateRoutes');

const app = express();
const server = http.createServer(app);

const {
  handleLiveVoiceConnection
} = require('./src/controllers/liveVoiceController');

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/debates', debateRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'DebateAI Backend is running'
  });
});

const voiceServer = new WebSocketServer({
  server,
  path: '/api/debates/voice'
});

voiceServer.on('connection', (socket) => {
  console.log('Voice WebSocket connection received.');
  handleLiveVoiceConnection(socket);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`DebateAI server running on port ${PORT}`);
      console.log('Voice WebSocket server is ready.');
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
