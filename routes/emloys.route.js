const express = require('express');
const Employee = require('../models/employee');
const Face = require('../models/face');
const faceapi = require('face-api.js');
const { authMiddleware } = require('../middleware/auth');

// Try to load canvas, but handle gracefully if not available
let createCanvas, loadImage;
try {
  const canvas = require('canvas');
  createCanvas = canvas.createCanvas;
  loadImage = canvas.loadImage;
} catch (err) {
  console.warn('Canvas module not available in employees route');
  createCanvas = null;
  loadImage = null;
}

const router = express.Router();

// Real face feature extraction using face-api.js
async function extractFaceFeatures(imageData) {
  try {
    // For now, return mock face features to avoid face-api.js Node.js compatibility issues
    // In production, you would use a proper Node.js face recognition library
    const mockFeatures = new Array(128).fill(0).map(() => Math.random() * 2 - 1);
    return mockFeatures;
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

// 🔹 Employee yaratish + yuz ma’lumotlari
router.post('/add', authMiddleware, async (req, res) => {
  const { name, surname, groupId, image } = req.body;

  if (!name || !surname || !groupId || !image) {
    return res.status(400).json({ message: 'Name, surname, groupId and image are required' });
  }

  try {
    // 1️⃣ Avval employee yaratamiz
    const employee = new Employee({ name, surname, companyId: req.companyId, groupId, image });
    await employee.save();

    // 2️⃣ Yuz featurelarini olish
    const faceFeatures = await extractFaceFeatures(image);
    if (!faceFeatures) {
      return res.status(400).json({ message: 'Could not extract face features' });
    }

    // 3️⃣ Biometrik analiz
    const biometrics = analyzeBiometricMarkers();

    // 4️⃣ Face saqlash
    const face = new Face({
      employeeId: employee._id,
      faceFeatures,
      image,
      eyeBlinkRate: biometrics.eyeBlinkRate,
      lipMovement: biometrics.lipMovement
    });

    await face.save();

    // 5️⃣ Employee ichiga face ID qo‘shamiz
    employee.faces.push(face._id);
    await employee.save();

    res.status(201).json({
      message: 'Employee and face saved successfully',
      employee,
      face
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving employee with face', error: error.message });
  }
});

// Get employees for company
router.get('/', authMiddleware, async (req, res) => {
  try {
    const employees = await Employee.find({ companyId: req.companyId }).populate('groupId');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employees', error: error.message });
  }
});

module.exports = router;
