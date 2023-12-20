document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();

    const name = document.getElementById('name');
    const email = document.getElementById('email');
    const message = document.getElementById('message');
    const submitButton = document.querySelector('input[type="submit"]');

    if (name.value.trim() === '' || email.value.trim() === '' || message.value.trim() === '') {
        alert('All fields are required');
        return;
    }

    submitButton.disabled = true;

    fetch('/send-email', {
        method: 'POST',
        body: new FormData(event.target)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            // Only show the alert box if the email was sent successfully
            document.getElementById('alert').classList.remove('hidden');
            // Dispatch a custom event
            const event = new Event('messageSent');
            document.dispatchEvent(event);
            // Reset the form
            name.value = '';
            email.value = '';
            message.value = '';
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        })
        .finally(() => {
            submitButton.disabled = false;
        });
});
document.getElementById('close-alert').addEventListener('click', function() {
    document.getElementById('alert').classList.add('hidden');
});