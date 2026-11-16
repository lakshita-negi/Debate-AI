
const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/authMiddleware');

const {
  startDebate,
  generateOpeningArgument,
  sendMessage,
  endDebate,
  getMyDebates,
  getDebateById
} = require('../controllers/debateController');

router.post('/start', verifyToken, startDebate);

router.post('/:id/opening', verifyToken, generateOpeningArgument);

router.post('/:id/message', verifyToken, sendMessage);

router.post('/:id/end', verifyToken, endDebate);

router.get('/my-debates', verifyToken, getMyDebates);

router.get('/:id', verifyToken, getDebateById);

module.exports = router;
