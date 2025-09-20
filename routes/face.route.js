const express = require('express');
const Face = require('../models/face');
const Employee = require('../models/employee');
const { createCanvas, loadImage } = require('canvas');
const faceapi = require('face-api.js');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Real face feature extraction using face-api.js
async function extractFaceFeatures(imageData) {
  try {
    const img = await loadImage(imageData);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const detection = await faceapi.detectSingleFace(canvas).withFaceLandmarks().withFaceDescriptor();
    if (!detection) return null;
    return Array.from(detection.descriptor);
  } catch (err) {
    console.error('Error extracting features:', err);
    return null;
  }
}

function analyzeBiometricMarkers() {
  return {
    eyeBlinkRate: Math.random() * 0.5,
    lipMovement: Math.random() * 0.5,
  };
}

// 🔹 Mavjud employee uchun yangi yuz qo‘shish
router.post('/add', authMiddleware, async (req, res) => {
  const { employeeId, image } = req.body;

  if (!employeeId || !image) {
    return res.status(400).json({ message: 'Employee ID and image are required' });
  }

  const faceFeatures = await extractFaceFeatures(image);
  if (!faceFeatures) {
    return res.status(400).json({ message: 'Could not extract features' });
  }

  const biometrics = analyzeBiometricMarkers();

  try {
    const newFace = new Face({
      employeeId,
      faceFeatures,
      image,
      eyeBlinkRate: biometrics.eyeBlinkRate,
      lipMovement: biometrics.lipMovement
    });

    await newFace.save();

    // employee ichiga qo‘shib qo‘yamiz
    await Employee.findByIdAndUpdate(employeeId, { $push: { faces: newFace._id } });

    res.json({ message: 'Face data saved successfully', face: newFace });
  } catch (error) {
    res.status(500).json({ message: 'Error saving face data', error: error.message });
  }
});

module.exports = router;
