const Attendance = require('../models/Attendance');
const User = require('../models/User');

function serializeAttendance(att) {
  return {
    id: att._id,
    user_id: att.userId?._id ?? att.userId,
    intern_name: att.userId?.name ?? null,
    department: att.userId?.department ?? null,
    date: att.date,
    check_in: att.checkIn ?? null,
    check_out: att.checkOut ?? null,
    status: att.status,
    remarks: att.remarks ?? null,
  };
}

async function checkIn(req, res, next) {
  try {
    const today = new Date().setHours(0,0,0,0);
    let att = await Attendance.findOne({ userId: req.user.id, date: today });

    if (att && att.checkIn) return res.status(409).json({ message: 'Already checked in.' });
    
    if (!att) {
      att = await Attendance.create({ userId: req.user.id, checkIn: new Date(), status: 'present' });
    } else {
      att.checkIn = new Date();
      await att.save();
    }
    res.status(201).json({ attendance: serializeAttendance(att) });
  } catch (err) { next(err); }
}
// Add this function definition to your attendanceController.js
async function getMyAttendance(req, res, next) {
  try {
    // You can filter by userId if you have that field in your Attendance model
    const attendance = await Attendance.find({ userId: req.user.id }).sort({ date: -1 });
    res.json({ attendance: attendance.map(serializeAttendance) });
  } catch (err) {
    next(err);
  }
}
async function checkOut(req, res, next) {
  try {
    const today = new Date().setHours(0,0,0,0);
    const att = await Attendance.findOne({ userId: req.user.id, date: today });

    if (!att || !att.checkIn) return res.status(400).json({ message: 'Check in first.' });
    if (att.checkOut) return res.status(409).json({ message: 'Already checked out.' });

    att.checkOut = new Date();
    await att.save(); // Model hook handles status update
    res.json({ attendance: serializeAttendance(att) });
  } catch (err) { next(err); }
}

async function listAttendance(req, res, next) {
  try {
    const { userId, from, to, status, department } = req.query;
    
    // 1. Build Filter
    let filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    // 2. Handle Mentor scoping (Join equivalent)
    if (req.user.role === 'mentor') {
      const interns = await User.find({ mentorId: req.user.id }).select('_id');
      filter.userId = { $in: interns.map(i => i._id) };
    }

    // 3. Query with Population to include user details
    const attendance = await Attendance.find(filter)
      .populate('userId', 'name department mentorId')
      .sort({ date: -1 });

    res.json({ attendance: attendance.map(serializeAttendance) });
  } catch (err) { next(err); }
}
// Add this function to your attendanceController.js
async function updateAttendance(req, res, next) {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const att = await Attendance.findByIdAndUpdate(
      id,
      { status, remarks },
      { new: true }
    ).populate('userId', 'name department mentorId');

    if (!att) return res.status(404).json({ message: 'Attendance record not found.' });
    res.json({ attendance: serializeAttendance(att) });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkIn, checkOut, getMyAttendance,listAttendance,updateAttendance };