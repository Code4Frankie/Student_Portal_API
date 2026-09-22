const studentModel = require("../model/studentModel.js")

/**
 * CRUD
 * CREATE STUDENT (POST)
 * READ STUDENT (GET): GENERAL GET, SINGLE GET
 * UPDATE STUDENT (PATCH) -> name only
 * DELETE STUDENT (DELETE)
 */

//CREATE STUDENT
const createStudent = async (req, res) => {
    try {
        const { name, regNo, email } = req.body
        const student = await studentModel.create({
            name, regNo, email
        })
        return res.status(201).json({
            message: "Student account created successfully",
            data: student
        })
    } catch (error) {
        return res.status(500).json({ message: error.message })
    }
}

//GENERAL GET
const getAllStudents = async (req, res) => {
    try {
        const getAll = await studentModel.find()
        return res.status(200).json({
            message: "All students fetched successfully",
            data: getAll
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }

}

//SINGLE GET
const getSingleStudent = async (req, res) => {
    try {
        const { id } = req.params
        const getSingle = await studentModel.findById(id)

        if (!getSingle) {
            return res.status(404).json({
                message: "Student not found"
            })
        }
        return res.status(200).json({
            message: "Student fetched successfully",
            data: getSingle
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }

}

//UPDATE STUDENT
//Restriction: only "name" can be updated. regNo and email must remain unchanged,
//so they are never taken from the request body no matter what is sent.
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params
        const { name } = req.body

        if (!name) {
            return res.status(400).json({
                message: "Name is required to update profile"
            })
        }

        const updatedStudent = await studentModel.findByIdAndUpdate(
            id,
            { name },
            { new: true, runValidators: true }
        )

        if (!updatedStudent) {
            return res.status(404).json({
                message: "Student not found"
            })
        }

        return res.status(200).json({
            message: "Student profile updated successfully",
            data: updatedStudent
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

//DELETE STUDENT
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params
        const deletedStudent = await studentModel.findByIdAndDelete(id)

        if (!deletedStudent) {
            return res.status(404).json({
                message: "Student not found"
            })
        }

        return res.status(200).json({
            message: "Student account deleted successfully",
            data: deletedStudent
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

module.exports = {
    createStudent,
    getAllStudents,
    getSingleStudent,
    updateStudent,
    deleteStudent
}
