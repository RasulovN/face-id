const mongoose = require('mongoose');

const faceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  faceFeatures: { type: [Number], required: true }, // embedding (masalan 128D vektor)
  image: { type: String }, // base64 yoki file path
  eyeBlinkRate: { type: Number, default: 0 },
  lipMovement: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Face', faceSchema);
