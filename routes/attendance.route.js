const express = require('express');
const Attendance = require('../models/attendance');
const Employee = require('../models/employee');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Record entry
router.post('/entry', authMiddleware, async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ message: 'Employee ID is required' });
  }

  try {
    const employee = await Employee.findById(employeeId);
    if (!employee || employee.companyId.toString() !== req.companyId.toString()) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const attendance = new Attendance({
      employeeId,
      groupId: employee.groupId,
      companyId: req.companyId,
      entryTime: new Date()
    });

    await attendance.save();
    res.json({ message: 'Entry recorded', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Error recording entry', error: error.message });
  }
});

// Record exit
router.post('/exit', authMiddleware, async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ message: 'Employee ID is required' });
  }

  try {
    const attendance = await Attendance.findOne({ employeeId, exitTime: null }).sort({ entryTime: -1 });
    if (!attendance) {
      return res.status(404).json({ message: 'No active entry found' });
    }

    attendance.exitTime = new Date();
    await attendance.save();
    res.json({ message: 'Exit recorded', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Error recording exit', error: error.message });
  }
});

// Get attendance for company
router.get('/', authMiddleware, async (req, res) => {
  try {
    const attendances = await Attendance.find({ companyId: req.companyId })
      .populate('employeeId', 'name surname')
      .populate('groupId', 'name')
      .sort({ date: -1 });
    res.json(attendances);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance', error: error.message });
  }
});

// Export attendance as CSV
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const attendances = await Attendance.find({ companyId: req.companyId })
      .populate('employeeId', 'name surname')
      .populate('groupId', 'name')
      .sort({ date: -1 });

    const csv = 'Name,Surname,Group,Entry Time,Exit Time,Date\n' +
      attendances.map(att => 
        `${att.employeeId.name},${att.employeeId.surname},${att.groupId.name},${att.entryTime},${att.exitTime || ''},${att.date}`
      ).join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment('attendance.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Error exporting attendance', error: error.message });
  }
});

module.exports = router;
