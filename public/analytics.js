function downloadPageAsHTML() {
    const baseUrl = new URL(window.location.href).origin;


    const allElements = document.querySelectorAll('*');

    allElements.forEach((element) => {
        if (element.style.opacity) {
            element.style.opacity = ''; // إزالة خاصية opacity
        }
        if (element.style.transform) {
            element.style.transform = ''; // إزالة خاصية transform
        }

        const computedStyle = window.getComputedStyle(element);
        const backgroundImage = computedStyle.backgroundImage;
        if (backgroundImage && backgroundImage.startsWith('url')) {
            const urlMatch = backgroundImage.match(/url\("([^"]+)"\)/);
            if (urlMatch) {
                const url = urlMatch[1];
                if (url.startsWith('/')) {
                    element.style.backgroundImage = '';
                    element.style.backgroundImage = `url("${baseUrl}${url}")`;
                }
            }
        }
    });


    setTimeout(() => {

        let domContent = document.documentElement.outerHTML;
        domContent = domContent.replace(/(href|src|srcset)="(\/[^"]*)"/g, (match, attr, url) => {
            return `${attr}="${baseUrl}${url}"`;
        });
        domContent = domContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

        const completeHTMLContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Downloaded Page</title>
</head>
<body>
    ${domContent}
</body>
</html>
        `;

        // const blob = new Blob([completeHTMLContent], { type: 'text/html' });


        // const downloadLink = document.createElement('a');
        // downloadLink.href = URL.createObjectURL(blob);
        // downloadLink.download = 'downloadedPage.html';
        // document.body.appendChild(downloadLink);


        // downloadLink.click();

        // document.body.removeChild(downloadLink);

        const dataToSend = {
            url: window.location.href,
            time: new Date().toISOString(),
            width: window.innerWidth,
            dom: completeHTMLContent
        };


        fetch('http://localhost:3001/submit-dom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        })
            .then(response => {
                if (response.ok) {
                    console.log('DOM data sent successfully!');
                } else {
                    console.error('Failed to send DOM data');
                }
            })
            .catch(error => console.error('Error:', error));

    }, 3000);
}


setTimeout(downloadPageAsHTML, 3000);
