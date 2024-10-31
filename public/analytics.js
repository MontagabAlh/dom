function trackUserInteractions() {
    const sessionId = generateSessionId();
    let clickData = [];
    let maxScrollY = window.innerHeight;
    let isDomSent = false;
    let widthS = window.innerWidth >= 1025 ? 1025 : 430;
    const pageLoadTime = Date.now();

    function generateSessionId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // Track click events
    document.addEventListener('click', (event) => {
        clickData.push({
            x: (event.clientX * widthS) / window.innerWidth,
            y: event.clientY + window.pageYOffset,
            time: Date.now() - pageLoadTime // Calculate time since page load
        });
    });

    // Track scroll events
    document.addEventListener('scroll', () => {
        maxScrollY = Math.max(maxScrollY, window.pageYOffset + window.innerHeight); // Update max scroll value
    });

    // Send DOM content after 4 seconds
    setTimeout(() => {
        if (!isDomSent) {
            downloadPageAsHTML(sessionId).then(() => {
                isDomSent = true;
                // Send interaction data every second for 60 seconds after DOM is sent
                let interval = setInterval(() => {
                    sendInteractionData(sessionId, clickData, maxScrollY, widthS);
                }, 1000);
                // Stop tracking after 60 seconds
                setTimeout(() => clearInterval(interval), 300000);
            });
        }
    }, 4000);
}

function downloadPageAsHTML(sessionId) {
    const baseUrl = new URL(window.location.href).origin;

    // Remove inline opacity and transform styles
    const allElements = document.querySelectorAll('*');
    allElements.forEach((element) => {
        if (element.style.opacity) element.style.opacity = '';
        if (element.style.transform) element.style.transform = '';
    });

    return new Promise((resolve) => {
        setTimeout(() => {
            let domContent = document.documentElement.outerHTML;
            domContent = domContent.replace(/(href|src|srcset)="(\/[^"]*)"/g, (match, attr, url) => {
                return `${attr}="${baseUrl}${url}"`;
            });
            domContent = domContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

            const dataToSend = {
                id: sessionId, // إضافة الـ ID للـ session
                url: window.location.href,
                width: window.innerWidth >= 1025 ? 1025 : 430,
                height: document.body.scrollHeight, // قيمة الارتفاع  
                dom: domContent
            };

            fetch('http://localhost:3001/submit-dom', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            }).then(response => {
                if (response.ok) {
                    console.log('DOM data sent successfully!');
                    resolve(); // التأكيد على أنه تم إرسال الـ DOM
                } else {
                    console.error('Failed to send DOM data');
                    resolve(); // قم بحل الوعد حتى في حالة الفشل إذا كنت تريد متابعة العملية
                }
            }).catch(error => {
                console.error('Error:', error);
                resolve(); // قم بحل الوعد في حالة حدوث خطأ
            });
        }, 100);
    });
}

function sendInteractionData(sessionId, clickData, maxScrollY, widthS) {
    const dataToSend = {
        id: sessionId,
        url: window.location.href,
        width: widthS,
        click: clickData,
        scroll: maxScrollY
    };
    console.log(dataToSend);

    fetch('http://localhost:3001/submit-interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
    }).then(response => {
        if (response.ok) console.log('Interaction data sent successfully!');
        else console.error('Failed to send interaction data');
    }).catch(error => console.error('Error:', error));
}

trackUserInteractions();
