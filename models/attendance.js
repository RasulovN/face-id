const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  entryTime: { type: Date, required: true },
  exitTime: { type: Date },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
