document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();

    fetch('/send-email', {
        method: 'POST',
        body: new FormData(event.target)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            document.getElementById('alert').classList.remove('hidden');
            // Dispatch a custom event
            const event = new Event('messageSent');
            document.dispatchEvent(event);
            // Reset the form
            document.getElementById('name').value = '';
            document.getElementById('email').value = '';
            document.getElementById('message').value = '';
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
});

// Listen for the custom event
document.addEventListener('messageSent', function() {
    console.log('Message has been sent successfully!');
});

document.getElementById('close-alert').addEventListener('click', function() {
    document.getElementById('alert').classList.add('hidden');
});