const faceapi = require('face-api.js');
const { loadImage } = require('canvas');
const Employee = require('../models/employee');

async function verifyFace(imageData, socket) {
  try {
    const storedFaces = await Employee.find({}).select('name faceFeatures');
    if (!storedFaces.length) {
      socket.emit('verification_result', [{ verified: false, name: 'Nomalum shaxs' }]);
      return;
    }

    const labeledDescriptors = storedFaces.map(face => 
      new faceapi.LabeledFaceDescriptors(face.name, [new Float32Array(face.faceFeatures)])
    );
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

    const img = await loadImage(imageData);
    const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

    if (!detections.length) {
      socket.emit('verification_result', [{ verified: false, name: 'Nomalum shaxs' }]);
      return;
    }

    const results = detections.map(d => {
      const bestMatch = faceMatcher.findBestMatch(d.descriptor);
      const verified = bestMatch.label !== 'unknown';
      return {
        verified,
        name: verified ? bestMatch.label : 'Nomalum shaxs',
        distance: bestMatch.distance.toFixed(4)
      };
    });

    socket.emit('verification_result', results);
  } catch (err) {
    console.error('Verification error:', err);
    socket.emit('verification_result', [{ verified: false, name: 'Nomalum shaxs' }]);
  }
}

async function extractFaceFeatures(imageData) {
  try {
    const img = await loadImage(imageData);
    const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
    if (!detection) return null;
    return Array.from(detection.descriptor);
  } catch (err) {
    console.error('Extraction error:', err);
    return null;
  }
}

module.exports = { verifyFace, extractFaceFeatures };