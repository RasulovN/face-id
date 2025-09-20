const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData, createCanvas, loadImage } = require('canvas');

// Patch the environment for face-api.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MongoDB Schema
const faceSchema = new mongoose.Schema({
  name: String,
  faceFeatures: [Number]
});

const Face = mongoose.model('Face', faceSchema);

app.use(express.json());
app.use(express.static('public'));

// Load models for face-api.js
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromDisk(path.join(__dirname, 'models')),
  faceapi.nets.faceLandmark68Net.loadFromDisk(path.join(__dirname, 'models')),
  faceapi.nets.faceRecognitionNet.loadFromDisk(path.join(__dirname, 'models'))
]).then(() => console.log('Models loaded successfully!'));

app.get('/check', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'check.html'));
});

// Socket connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('check', async (imageData) => {
    const result = await verifyFace(imageData);
    socket.emit('verification_result', result);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

async function verifyFace(imageData) {
  const storedFaces = await Face.find({}); // Retrieve stored faces

  if (!storedFaces || storedFaces.length === 0) {
    return [{ verified: false, name: 'Nomalum shaxs' }];
  }

  const imageFeatures = await extractFaceFeatures(imageData);
  if (!imageFeatures) {
    return [{ verified: false, name: 'Nomalum shaxs' }];
  }

  const verificationResults = storedFaces.map(storedFace => {
    const isVerified = compareFaceFeatures(storedFace.faceFeatures, imageFeatures);

    return {
      verified: isVerified,
      name: isVerified ? storedFace.name : 'Nomalum shaxs',
    };
  });

  const verifiedResults = verificationResults.filter(result => result.verified);

  if (verifiedResults.length === 0) {
    return [{ verified: false, name: 'Nomalum shaxs' }];
  }

  return verifiedResults;
}

function compareFaceFeatures(storedFeatures, inputFeatures) {
  if (storedFeatures.length !== inputFeatures.length) return false;

  let dotProduct = 0;
  let storedMagnitude = 0;
  let inputMagnitude = 0;

  for (let i = 0; i < storedFeatures.length; i++) {
    dotProduct += storedFeatures[i] * inputFeatures[i];
    storedMagnitude += Math.pow(storedFeatures[i], 2);
    inputMagnitude += Math.pow(inputFeatures[i], 2);
  }

  const cosineSimilarity = dotProduct / (Math.sqrt(storedMagnitude) * Math.sqrt(inputMagnitude));
  return cosineSimilarity > 0.8;
}

async function extractFaceFeatures(imageData) {
  try {
    // Convert base64 image data into an Image object
    const img = await loadImage(imageData);

    // Create a canvas and draw the image onto it
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    // Use face-api.js for face detection and feature extraction
    const detections = await faceapi.detectAllFaces(canvas, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length > 0) {
      const faceDescriptor = detections[0].descriptor; // Use the first detected face
      return Array.from(faceDescriptor); // Convert to a plain array
    }

    return null; // No face detected
  } catch (err) {
    console.error('Error extracting features:', err);
    return null;
  }
}

app.post('/detection', async (req, res) => {
  const { name, image } = req.body;

  if (!name || !image) {
    return res.status(400).json({ message: 'Name and image are required' });
  }

  const faceFeatures = await extractFaceFeatures(image);

  if (!faceFeatures) {
    return res.status(400).json({ message: 'Could not extract features' });
  }

  const newFace = new Face({
    name,
    faceFeatures,
  });

  try {
    await newFace.save();
    res.json({ message: 'Face data saved successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error saving face data', error });
  }
});

mongoose.connect('mongodb://127.0.0.1:27017/face_detection', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
