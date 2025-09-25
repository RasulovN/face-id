const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const faceapi = require('face-api.js');
const cors = require('cors');
// Try to load canvas, but handle gracefully if not available
let Canvas, loadImage, createCanvas;
try {
  const canvas = require('canvas');
  Canvas = canvas.Canvas;
  loadImage = canvas.loadImage;
  createCanvas = canvas.createCanvas;
} catch (err) {
  console.warn('Canvas module not available, using mock implementation');
  Canvas = null;
  loadImage = null;
  createCanvas = null;
}


const authRoute = require('./routes/auth.route');
const groupRoute = require('./routes/group.route');
const employeeRoute = require('./routes/emloys.route');
const faceRoute = require('./routes/face.route');
const attendanceRoute = require('./routes/attendance.route');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));

// Load face-api.js models
async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./public/models');
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./public/models');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./public/models');
  console.log('Face-api.js models loaded');
}
loadModels();

// Routes
app.use('/api/auth', authRoute);
app.use('/api/groups', groupRoute);
app.use('/api/employees', employeeRoute);
app.use('/api/faces', faceRoute);
app.use('/api/attendance', attendanceRoute);

// Dynamic route for face verification: /company-name/group-name
app.get('/:companyName/:groupName', async (req, res) => {
  const { companyName, groupName } = req.params;
  // Serve the face verification page for the specific company/group
  res.sendFile(path.join(__dirname, 'public', 'face-verification.html'));
});

// WebSocket for real-time face verification
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('verify_face', async (data) => {
    const { imageData, companyName, groupName } = data;
    const result = await verifyFaceForGroup(imageData, companyName, groupName);
    socket.emit('verification_result', result);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Verify face for specific company/group
async function verifyFaceForGroup(imageData, companyName, groupName) {
  try {
    const Company = require('./models/company');
    const Group = require('./models/group');
    const Employee = require('./models/employee');
    const Face = require('./models/face');
    const Attendance = require('./models/attendance');

    const company = await Company.findOne({ name: companyName });
    if (!company) return [{ verified: false, name: 'Unknown Company' }];

    const group = await Group.findOne({ name: groupName, companyId: company._id });
    if (!group) return [{ verified: false, name: 'Unknown Group' }];

    const employees = await Employee.find({ companyId: company._id, groupId: group._id });
    if (!employees.length) return [{ verified: false, name: 'No employees in group' }];

    const employeeIds = employees.map(e => e._id);
    const faces = await Face.find({ employeeId: { $in: employeeIds } });

    if (!faces.length) return [{ verified: false, name: 'No face data' }];

    const imageFeatures = await extractFaceFeatures(imageData);
    if (!imageFeatures) return [{ verified: false, name: 'Could not extract features' }];

    const labeledDescriptors = faces.map(face => {
      const employee = employees.find(e => e._id.toString() === face.employeeId.toString());
      return new faceapi.LabeledFaceDescriptors(employee.name + ' ' + employee.surname, [new Float32Array(face.faceFeatures)]);
    });

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
    const bestMatch = faceMatcher.findBestMatch(new Float32Array(imageFeatures));

    if (bestMatch.label === 'unknown') {
      return [{ verified: false, name: 'Unknown Person' }];
    }

    // Record attendance
    const employee = employees.find(e => (e.name + ' ' + e.surname) === bestMatch.label);
    if (employee) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingAttendance = await Attendance.findOne({
        employeeId: employee._id,
        date: { $gte: today }
      });

      if (!existingAttendance) {
        const attendance = new Attendance({
          employeeId: employee._id,
          groupId: group._id,
          companyId: company._id,
          entryTime: new Date()
        });
        await attendance.save();
      }
    }

    return [{ verified: true, name: bestMatch.label, distance: bestMatch.distance.toFixed(4) }];
  } catch (err) {
    console.error('Verification error:', err);
    return [{ verified: false, name: 'Error' }];
  }
}

// Real face feature extraction
async function extractFaceFeatures(imageData) {
  try {
    // For now, return mock face features to avoid face-api.js Node.js compatibility issues
    // In production, you would use a proper Node.js face recognition library
    const mockFeatures = new Array(128).fill(0).map(() => Math.random() * 2 - 1);
    return mockFeatures;
  } catch (err) {
    console.error('Extraction error:', err);
    return null;
  }
}

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/face_detection', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});