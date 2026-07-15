const db = require("../Db");

function registerStudent(student, callback) {

    const sql = `
    INSERT INTO students(student_id,name,email,password)
    VALUES(?,?,?,?)
    `;

    db.query(
        sql,
        [
            student.student_id,
            student.name,
            student.email,
            student.password
        ],
        callback
    );

}

module.exports = {
    registerStudent
};