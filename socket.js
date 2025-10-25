const socketIo = require('socket.io');
const userModel = require('./models/user.model');
const captainModel = require('./models/captain.model');

let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('join', async (data) => {
      const { userId, userType } = data;
      if (userType === 'user') {
        await userModel.findByIdAndUpdate(userId, { socketId: socket.id });
      } else if (userType === 'captain') {
        await captainModel.findByIdAndUpdate(userId, { socketId: socket.id });
      }
    });

    socket.on('update-location-captain', async (data) => {
      const { userId, location } = data;
      
      if (!userId || !location || !location.lat || !location.lng) {
        return;
      }

      try {
        await captainModel.findByIdAndUpdate(userId, {
          location: {
            type: 'Point',
            coordinates: [location.lng, location.lat] 
          }
        });
       
      } catch (error) {
        
      }
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

function sendMessageToSocketId(socketId, eventName, data) {
  if (!io) {
    return;
  }
  io.to(socketId).emit(eventName, data);
}

module.exports = { initializeSocket, getIO, sendMessageToSocketId };