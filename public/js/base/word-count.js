document.addEventListener('DOMContentLoaded', (event) => {
        const message = document.getElementById('message');
        const wordCount = document.getElementById('number');

        if (message) {
            message.addEventListener('input', function (event) {
                    const numChars = this.value.length;
                    const remaining = 500 - numChars;
                    this.style.height = 'auto';
                    this.style.height = (this.scrollHeight) + 'px';

                    if (remaining <= 0) {
                        event.preventDefault();
                        this.value = this.value.slice(0, 500);
                        wordCount.textContent = '0 ';
                        wordCount.style.color = 'red';
                    } else if (remaining <= 50) {
                        wordCount.textContent = `${remaining} `;
                        wordCount.style.color = 'red';
                    } else if (remaining <= 249) {
                        wordCount.textContent = `${remaining} `;
                        wordCount.style.color = 'orange';
                    } else {
                        wordCount.textContent = `${remaining} `;
                        wordCount.style.color = 'green';
                    }
                }
            );
        }
    }
);