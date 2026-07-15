require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

const db = require("./Db");
const authRoutes = require("./routes/Auth");

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);

app.get("/", (req, res) => {
    res.send("Student Portal Backend Running 🚀");
});

app.listen(process.env.PORT || 5000, () => {
    console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
});