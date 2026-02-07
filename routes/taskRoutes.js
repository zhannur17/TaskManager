//Symbat
const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getAllTasks,
  sendReminder,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const { validate } = require('../middleware/validation');

const router = express.Router();

router.get('/admin/all', protect, authorize('admin'), getAllTasks);

router.post('/', protect, validate('taskCreate'), createTask);
router.get('/', protect, getTasks);
router.get('/:id', protect, getTaskById);
router.put('/:id', protect, validate('taskUpdate'), updateTask);
router.delete('/:id', protect, deleteTask);
router.post('/:id/remind', protect, sendReminder);

module.exports = router;
