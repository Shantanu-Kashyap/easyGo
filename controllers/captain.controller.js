const captainModel = require('../models/captain.model');
const rideModel = require('../models/ride.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const sanitizeCaptain = (c) => {
  if (!c) return null;
  const obj = c.toObject ? c.toObject() : { ...c };
  delete obj.password;
  return obj;
};

module.exports.getProfile = async (req, res) => {
  try {
    const captain = await captainModel.findById(req.captain._id).select('-password');
    return res.status(200).json({ captain: sanitizeCaptain(captain) });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const captain = await captainModel.findOne({ email }).select('+password');
    if (!captain) return res.status(404).json({ message: 'Account not found' });

    if (!captain.password) {
      return res.status(500).json({ message: 'Invalid account data — contact support' });
    }

    const ok = await bcrypt.compare(password, captain.password);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ _id: captain._id, userType: 'captain' }, process.env.JWT_SECRET, { expiresIn: '30d' });

  
    const captainData = await captainModel.findById(captain._id).select('-password');
    return res.status(200).json({ captain: sanitizeCaptain(captainData), token });
  } catch (err) {
    return res.status(500).json({ message: 'Server error — check backend logs' });
  }
};

module.exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, password, vehicle } = req.body;
    if (!email || !password || !firstname) {
      return res.status(400).json({ message: 'firstname, email and password required' });
    }

    const exists = await captainModel.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const created = await captainModel.create({
      fullname: { firstname, lastname },
      email,
      password,
      vehicle: vehicle || {}
    });

    const token = jwt.sign({ _id: created._id, userType: 'captain' }, process.env.JWT_SECRET, { expiresIn: '30d' });

    
    const captainData = await captainModel.findById(created._id).select('-password');
    return res.status(201).json({ captain: sanitizeCaptain(captainData), token });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports.getCaptainStatus = async (req, res) => {
  try {
    const captain = req.captain || null;
    return res.status(200).json({
      ok: true,
      captainId: captain?._id || null,
      online: !!(captain && captain.socketId),
      status: captain?.status || 'inactive'
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.updateStatus = async (req, res) => {
  try {
    const allowed = ['active', 'inactive', 'busy'];
    const { status } = req.body;
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await captainModel.findByIdAndUpdate(
      req.captain._id,
      { status },
      { new: true }
    ).select('-password');

    return res.status(200).json(updated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getCaptainStats = async (req, res) => {
  try {
    const captainId = req.captain._id;

    const stats = await rideModel.aggregate([
      { $match: { captain: captainId, status: { $in: ['completed', 'ended'] } } },
      {
        $group: {
          _id: '$captain',
          totalRides: { $sum: 1 },
          totalEarnings: { $sum: { $ifNull: ['$fare', 0] } },
          totalDistance: { $sum: { $ifNull: ['$distance', 0] } },
          totalDurationSeconds: { $sum: { $ifNull: ['$duration', 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalRides: 0,
      totalEarnings: 0,
      totalDistance: 0,
      totalDurationSeconds: 0
    };

    const totalDistance = parseFloat(result.totalDistance.toFixed(1));
    const hoursOnline = parseFloat((result.totalDurationSeconds / 3600).toFixed(1));

    const captain = await captainModel.findById(captainId).select('-password');

    return res.status(200).json({
      totalRides: result.totalRides,
      totalEarnings: result.totalEarnings,
      totalDistance: totalDistance,
      totalHours: hoursOnline,
      captain
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};