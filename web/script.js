// تعريف المتغيرات لتخزين بيانات النقرات والصفحة الحالية
let clickData = {};
let pageData = {};
let currentWidth = 1025;
let scrollSections = [];
let url = '';

// إعداد خريطة الحرارة
const heatmapInstance = h337.create({
    container: document.getElementById('container'),
    maxOpacity: 1,
    radius: 40,
    blur: 0.90,
    max: 100,
    gradient: {
        0.25: 'blue',
        0.55: 'green',
        0.85: 'yellow',
        1: 'red'
    }
});

// دالة لجلب بيانات النقرات والصفحات
async function fetchData() {
    const [clickResponse, pageResponse] = await Promise.all([
        fetch('http://localhost:3001/get-data'),
        fetch('http://localhost:3001/get-pages')
    ]);
    clickData = await clickResponse.json();
    pageData = await pageResponse.json();

    // تعبئة القائمة المنسدلة بالصفحات المتاحة
    const pageSelect = document.getElementById('pageSelect');
    for (const key in pageData) {
        const option = document.createElement('option');
        option.value = key; // استخدام المفتاح كقيمة
        option.textContent = pageData[key].url;
        // عرض عنوان URL في القائمة المنسدلة
        pageSelect.appendChild(option);
    }
    // تحميل محتوى الصفحة الافتراضية إلى iframe
    loadPage(Object.keys(pageData)[0]); // تحميل أول صفحة في القائمة
}

// دالة لتحميل الصفحة المختارة
async function loadPage(key) {
    if (key) {
        const selectedPage = pageData[key];
        if (selectedPage) {
            const iframe = document.getElementById('iframe');
            iframe.srcdoc = selectedPage.dom;

            // تعيين قيمة url إلى عنوان الصفحة المختارة
            url = selectedPage.url; // تعيين قيمة url هنا
            console.log("Selected page URL: ", url); // لطباعة عنوان URL في وحدة التحكم

            renderClicks();
            renderScrollOverlay();
        }
    }
}

const canvas = document.getElementById('overlayCanvas');
canvas.width = document.getElementById('container').offsetWidth;
canvas.height = document.getElementById('iframe').height;

// دالة لتغيير عرض الإطار وإعادة رسم التراكب والنقرات بناءً على العرض
function toggleWidth(width) {
    currentWidth = width;
    const container = document.getElementById('container');
    container.style.width = `${width}px`;

    // إفراغ محتوى scrollValues عند تغيير الزر
    scrollValues = [];

    renderClicks();
    renderScrollOverlay();
}

// دالة لرسم خريطة الحرارة للنقرات على الشاشة
function renderClicks() {
    // إعادة تعيين بيانات الخريطة
    heatmapInstance.setData({ max: 1, data: [] });
    let heatmapData = [];

    Object.values(clickData[url]).forEach(userData => {
        const widthKey = `width${currentWidth}`;
        const clickEntries = userData[widthKey]?.click || [];

        clickEntries.forEach(click => {
            heatmapData.push({ x: Math.round(click.x), y: click.y, value: Math.floor(Math.random() * 10) });
        });
    });

    // تحديث خريطة الحرارة بالبيانات الجديدة
    heatmapInstance.setData({
        max: 10,  // جرب تغيير هذه القيمة وفقاً للبيانات
        data: heatmapData
    });
}

// دالة لتراكب التمرير بناءً على مدى وصول المستخدمين
function renderScrollOverlay() {
    const canvas = document.getElementById('overlayCanvas');
    const ctx = canvas.getContext('2d');
    const containerHeight = document.getElementById('iframe').height;

    canvas.width = document.getElementById('container').offsetWidth;
    canvas.height = containerHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height); // مسح اللوحة

    // جمع وتحليل بيانات التمرير
    let scrollValues = [];
    Object.values(clickData[url]).forEach(userData => {
        const widthKey = `width${currentWidth}`; // استخدام المفتاح الصحيح
        const scrollValue = userData[widthKey]?.scroll;
        if (scrollValue > 0) scrollValues.push(scrollValue);
    });
    console.log("scrollValues:", scrollValues);

    scrollValues.sort((a, b) => a - b);
    const totalVisits = scrollValues.length;
    const maxScroll = Math.max(...scrollValues);
    scrollSections = scrollValues.map((scroll, index) => ({
        scroll: scroll,
        percent: ((totalVisits - index) / totalVisits) * 100
    }));

    // رسم الألوان لتمييز المناطق الأكثر تصفحًا
    const colors = ["rgba(255, 0, 0, 0.3)", "rgba(255, 69, 0, 0.3)", "rgba(255, 140, 0, 0.3)", "rgba(255, 215, 0, 0.3)"];
    scrollSections.forEach((entry, index) => {
        const startY = index === 0 ? 0 : scrollSections[index - 1].scroll;
        const endY = Math.min(entry.scroll, maxScroll);
        const color = colors[index % colors.length];
        ctx.fillStyle = color;
        ctx.fillRect(0, startY, canvas.width, endY - startY);

        // إضافة علامة النسبة المئوية للتدرج الحالي
        addPercentageLabel(entry.percent, endY);
    });
}

// دالة لإضافة علامة النسبة المئوية على طول لوحة التمرير
function addPercentageLabel(percent, positionY) {
    const label = document.createElement('div');
    label.classList.add('percentage-label');
    label.style.top = `${positionY}px`;
    label.textContent = `${Math.round(percent)}%`;
    document.getElementById('container').appendChild(label);

    const line = document.createElement('div');
    line.classList.add('divider-line');
    line.style.top = `${positionY}px`;
    document.getElementById('container').appendChild(line);
}

// تحديث النسبة المئوية للتمرير عندما يتحرك المستخدم داخل إطار الصفحة
document.getElementById('container').addEventListener('mousemove', (e) => {
    const iframeRect = document.getElementById('iframe').getBoundingClientRect();
    if (e.clientY >= iframeRect.top && e.clientY <= iframeRect.bottom) {
        const percent = ((e.clientY - iframeRect.top) / iframeRect.height) * 100;
        const line = document.getElementById('dynamicLine');
        const percentageDisplay = document.getElementById('dynamicPercentage');

        line.style.display = 'block';
        line.style.top = `${e.clientY - iframeRect.top}px`;
        percentageDisplay.style.display = 'block';
        percentageDisplay.style.top = `${e.clientY - iframeRect.top}px`;
        percentageDisplay.textContent = `${Math.round(percent)}%`;
    } else {
        document.getElementById('dynamicLine').style.display = 'none';
        document.getElementById('dynamicPercentage').style.display = 'none';
    }
});

// استدعاء البيانات عند تحميل الصفحة
fetchData();
