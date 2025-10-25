const rideService = require('../services/ride.service');
const { validationResult } = require('express-validator');
const mapService = require('../services/maps.service');
const { sendMessageToSocketId, getIO } = require('../socket');
const rideModel = require('../models/ride.model');

module.exports.createRide = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination, vehicleType } = req.body;
    const userId = req.user._id;

    const ride = await rideService.createRide({
      user: userId,
      pickup,
      destination,
      vehicleType
    });

    await ride.populate('user');
    try {
      const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
      if (pickupCoordinates && pickupCoordinates.lat && pickupCoordinates.lng) {
        const captainsInRadius = await mapService.getCaptainsInTheRadius(
          pickupCoordinates.lat, 
          pickupCoordinates.lng,
          10 
        );

        const io = getIO();
        captainsInRadius.forEach((captain) => {
          if (captain.socketId) {
            sendMessageToSocketId(captain.socketId, 'new-ride', ride);
          }
        });
      } else {
      }
    } catch (coordError) {
     
    }

    return res.status(201).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.getFare = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { pickup, destination } = req.query;
    const fare = await rideService.getFare(pickup, destination);
    return res.status(200).json(fare);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.confirmRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    const captain = req.captain;

    const ride = await rideService.confirmRide({ rideId, captain });
    if (ride.user.socketId) {
      console.log('Sending ride-confirmed to user socket:', ride.user.socketId);
      sendMessageToSocketId(ride.user.socketId, 'ride-confirmed', ride);
    } 
  return res.status(200).json(ride);
  } catch (err) {
   
    return res.status(500).json({ message: err.message });
  }
};
module.exports.startRide = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rideId, otp } = req.query;
    const ride = await rideService.startRide({ rideId, otp, captain: req.captain });
    if (ride.user.socketId) {
      sendMessageToSocketId(ride.user.socketId, 'ride-started', ride);
    }

    return res.status(200).json(ride);
  } catch (err) {
   
    return res.status(500).json({ message: err.message });
  }
};

module.exports.endRide = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rideId } = req.body;
    const ride = await rideService.endRide({ rideId, captain: req.captain });
    if (ride.user.socketId) {
      sendMessageToSocketId(ride.user.socketId, 'ride-ended', ride);
    }
    if (ride.captain.socketId) {
      sendMessageToSocketId(ride.captain.socketId, 'ride-ended', ride);
    }

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};