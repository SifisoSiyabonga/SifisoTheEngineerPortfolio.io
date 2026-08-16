const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');

// 1. Submit a new maintenance request
router.post('/create', async (req, res) => {
  try {
    const { userId, title, category, priority, description } = req.body;

    const newRequest = new Maintenance({
      user: userId,
      title,
      category,
      priority,
      description
    });

    await newRequest.save();
    res.status(201).json({ message: 'Request submitted successfully', request: newRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Get all requests submitted by a specific tenant
router.get('/user/:userId', async (req, res) => {
  try {
    const requests = await Maintenance.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Admin: Get all requests across all tenants
router.get('/all', async (req, res) => {
  try {
    const requests = await Maintenance.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Update request status
router.patch('/update-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedRequest = await Maintenance.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ message: 'Status updated', request: updatedRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
