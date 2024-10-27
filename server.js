const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001; 


app.use(cors());


app.use(bodyParser.json());


app.post('/submit-dom', (req, res) => {
    const { url, time, width, dom } = req.body;

    const data = {
        url,
        time,
        width,
        dom
    };


    const filePath = path.join(__dirname, 'data', 'data.json');


    fs.readFile(filePath, (err, fileData) => {
        let jsonData = [];
        if (!err && fileData.length > 0) {
            jsonData = JSON.parse(fileData);
        }

        jsonData.push(data);

        fs.writeFile(filePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                return res.status(500).send('Error saving data');
            }
            res.status(200).send('Data saved successfully');
        });
    });
});


app.get('/get-data', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'data.json');

    fs.readFile(filePath, (err, fileData) => {
        if (err) {
            return res.status(500).send('Error reading data');
        }


        const jsonData = JSON.parse(fileData);
        res.status(200).json(jsonData);
    });
});


app.get('/analytics.js', (req, res) => {
    const filePath = path.join(__dirname, 'public', 'analytics.js');
    res.sendFile(filePath);
});

app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'web', 'index.html');
    res.sendFile(filePath);
});
app.get('/style.css', (req, res) => {
    const filePath = path.join(__dirname, 'web', 'style.css');
    res.sendFile(filePath);
});
app.get('/script.js', (req, res) => {
    const filePath = path.join(__dirname, 'web', 'script.js');
    res.sendFile(filePath);
});



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
