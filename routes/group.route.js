const express = require('express');
const Group = require('../models/group');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Create new group
router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Group name is required' });
  }

  try {
    const newGroup = new Group({ name, companyId: req.companyId });
    await newGroup.save();
    res.status(201).json({ message: 'Group created successfully', group: newGroup });
  } catch (error) {
    res.status(500).json({ message: 'Error creating group', error: error.message });
  }
});

// Get all groups for company
router.get('/', authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find({ companyId: req.companyId });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching groups', error: error.message });
  }
});

module.exports = router;
