const http = require('http');
const app = require('./app');
const port = process.env.PORT || 5000;
const connectToDb = require('./db/db');


const server = http.createServer(app);


const { initializeSocket } = require('./socket');
initializeSocket(server);


connectToDb()
  .then(() => {
    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  });