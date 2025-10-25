const mongoose = require('mongoose');

function connectToDb() {
    const dbUri = process.env.DB_URI || process.env.DB_CONNECT;
    
    if (!dbUri) {
        throw new Error('Database connection string missing');
    }
    
    return mongoose.connect(dbUri)
        .then(() => {
            console.log('Connected to MongoDB successfully');
        })
        .catch((err) => {
            console.error('MongoDB connection failed:', err.message);
            throw err;
        });
}

module.exports = connectToDb;
