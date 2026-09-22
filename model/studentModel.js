const mongoose = require('mongoose');


const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    regNo: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
});

const StudentModel = mongoose.model('Student', studentSchema);

module.exports = StudentModel;
