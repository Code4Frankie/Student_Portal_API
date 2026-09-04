require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const studentRoute = require("./routes/studentRoutes.js")

const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);


const actual_atlas_string = process.env.MONGO_URI;
mongoose.connect(actual_atlas_string)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("Connection Error: ", err));


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Student Portal API Dey Active!');
});

app.use('/', studentRoute);

app.listen(port, () => {
    console.log(`Server Dey Active on port :${port}`);
});

//https://github.com/Code4Frankie/Student_Portal_API.git
