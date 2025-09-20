const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Register a company
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, email, password } = req.body;

    try {
        const existingCompany = await Company.findOne({ email });
        if (existingCompany) return res.status(400).json({ message: 'Email already exists' });

        const company = new Company({ name, email, password });
        await company.save();
        res.status(201).json({ message: 'Company registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Login a company
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const company = await Company.findOne({ email });
        if (!company) return res.status(400).json({ message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, company.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: company._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});



module.exports = router