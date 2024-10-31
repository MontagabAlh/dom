const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(cors());

// تحديد مسارات الملفات
const domFilePath = path.join(__dirname, 'data', 'domData.json');
const interactionFilePath = path.join(__dirname, 'data', 'interactionData.json');

// التعامل مع بيانات DOM
app.post('/submit-dom', (req, res) => {
    const { url, height, dom } = req.body; // تم تغيير المتغير height إلى مجرد height

    fs.readFile(domFilePath, (err, fileData) => {
        let jsonData = {};

        if (!err && fileData.length > 0) {
            jsonData = JSON.parse(fileData);
        }

        // حفظ البيانات حسب url واستبدال القديم بالجديد
        const formattedUrl = url.replace(/[:/.]/g, "_");

        // إذا لم تكن الصفحة مخزنة، قم بإعطاء كلا من height1025 و height430 قيمة height
        if (!jsonData[formattedUrl]) {
            jsonData[formattedUrl] = {
                url,
                height1025: height,
                height430: height, // إعطاء height430 نفس القيمة
                dom
            };
        } else {
            // إذا كانت الصفحة موجودة، تحديث فقط الارتفاع المناسب
            jsonData[formattedUrl].url = url;
            jsonData[formattedUrl].dom = dom;

            // تحديد width المناسب
            const widthKey = height >= 1025 ? 'height1025' : 'height430';

            // تحديث القيمة المناسبة بناءً على الـ width
            if (height >= 1025) {
                jsonData[formattedUrl].height1025 = height; // تحديث height1025
            } else {
                jsonData[formattedUrl].height430 = height; // تحديث height430
            }
        }

        fs.writeFile(domFilePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                console.error('Error saving DOM data:', err);
                return res.status(500).send('Error saving DOM data');
            }
            res.status(200).send('DOM data saved successfully');
        });
    });
});



// التعامل مع بيانات التفاعل
app.post('/submit-interaction', (req, res) => {
    const { id, url, width, click, scroll } = req.body;

    fs.readFile(interactionFilePath, (err, fileData) => {
        let jsonData = {};

        if (!err && fileData.length > 0) {
            jsonData = JSON.parse(fileData);
        }

        // التأكد من وجود مصفوفة للـ URL إذا لم تكن موجودة
        if (!jsonData[url]) {
            jsonData[url] = {};
        }

        // التأكد من وجود كائن للـ id داخل URL المحدد إذا لم يكن موجودًا
        if (!jsonData[url][id]) {
            jsonData[url][id] = { width, width1025: { click: [], scroll: 0 }, width430: { click: [], scroll: 0 } };
        }

        // تحديد العرض المناسب
        const widthKey = width >= 1025 ? 'width1025' : 'width430';

        // تحديث بيانات السكرول لتكون أعلى قيمة
        jsonData[url][id][widthKey].scroll = Math.max(jsonData[url][id][widthKey].scroll || 0, scroll);

        // استبدال بيانات النقرات القديمة بالبيانات الجديدة
        jsonData[url][id][widthKey].click = Array.isArray(click) ? click : [];

        fs.writeFile(interactionFilePath, JSON.stringify(jsonData, null, 2), (err) => {
            if (err) {
                console.error('Error saving interaction data:', err);
                return res.status(500).send('Error saving interaction data');
            }
            res.status(200).send('Interaction data saved successfully');
        });
    });
});




// جلب البيانات
app.get('/get-pages', (req, res) => {
    fs.readFile(domFilePath, (err, fileData) => {
        if (err) return res.status(500).send('Error reading data');
        const jsonData = JSON.parse(fileData);
        res.status(200).json(jsonData);
    });
});

// جلب بيانات التفاعل
app.get('/get-data', (req, res) => {
    fs.readFile(interactionFilePath, (err, fileData) => {
        if (err) {
            return res.status(500).send('Error reading interaction data');
        }
        const jsonData = JSON.parse(fileData);
        res.status(200).json(jsonData);
    });
});

// التعامل مع الملفات الثابتة
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
