const express = require('express');
const studentRoute = express.Router();

const { createStudent, deleteStudent, getAllStudents, getSingleStudent, updateStudent } = require('../controller/studentController');

studentRoute.post('/students', createStudent);
studentRoute.get('/students', getAllStudents);
studentRoute.get('/students/:id', getSingleStudent);
studentRoute.patch('/students/:id', updateStudent);
studentRoute.delete('/students/:id', deleteStudent);

module.exports = studentRoute;
