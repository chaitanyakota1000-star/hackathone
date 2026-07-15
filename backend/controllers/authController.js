const studentModel = require("../models/studentModel");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {

    try {

        // Hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Replace the plain password with the hashed one
        req.body.password = hashedPassword;

        studentModel.registerStudent(req.body, (err) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json({
                message: "Student Registered Successfully"
            });

        });

    } catch (error) {

        res.status(500).json({
            message: error.message
        });

    }

};