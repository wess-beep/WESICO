const router = require('express').Router();
const User = require('../models/User');
const { auth, roles } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', auth, roles('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create user (admin only)
router.post('/', auth, roles('admin'), async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const { password, ...userData } = user.toObject();
    res.status(201).json(userData);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update user (admin only)
router.put('/:id', auth, roles('admin'), async (req, res) => {
  try {
    if (req.body.password) {
      const user = await User.findById(req.params.id);
      user.password = req.body.password;
      await user.save();
    }
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { name: req.body.name, email: req.body.email, role: req.body.role, active: req.body.active } },
      { new: true }
    ).select('-password');
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, roles('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: "Can't delete yourself" });
    await User.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
