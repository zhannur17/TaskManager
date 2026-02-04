const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Protected routes (require authentication)
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, validate('userUpdate'), updateUserProfile);

// Admin only routes
router.get('/', protect, authorize('admin'), getAllUsers);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;