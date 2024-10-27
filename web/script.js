
fetch('http://localhost:3001/get-data')
    .then(response => response.json())
    .then(data => {
        const visitList = document.getElementById('visitList');

        data.forEach((item, index) => {
            const visitItem = document.createElement('div');
            visitItem.className = 'visit-item';
            visitItem.innerText = `Visit #${index + 1}`;
            const visitDetails = document.createElement('div');
            visitDetails.className = 'visit-details';

            visitDetails.innerHTML = `
                <h2>Visit Details</h2>
                <p><strong>URL:</strong> ${item.url}</p>
                <p><strong>Time:</strong> ${item.time}</p>
                <p><strong>Width:</strong> ${item.width}px</p>
            `;

            const iframeContainer = document.createElement('div');
            iframeContainer.className = 'iframe-container';
            iframeContainer.style.width = `${item.width - 40}px`;

            const iframe = document.createElement('iframe');
            iframe.onload = function () {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                iframeDoc.open();
                iframeDoc.write(item.dom);
                iframeDoc.close();
            };

            iframeContainer.appendChild(iframe);
            visitDetails.appendChild(iframeContainer);

            visitItem.addEventListener('click', () => {

                document.querySelectorAll('.visit-details').forEach(detail => {
                    detail.style.display = 'none';
                });
                visitDetails.style.display = 'block';
            });
            visitList.appendChild(visitItem);
            contentContainer.appendChild(visitDetails);
        });
    })
    .catch(error => console.error('Error fetching data:', error));