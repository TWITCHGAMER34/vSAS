document.addEventListener('DOMContentLoaded', function () {
    // Animate the h1 element
    const h1 = document.querySelector('header h1');
    h1.animate([
        { opacity: 0, transform: 'translateY(-50px)' },
        { opacity: 1, transform: 'translateY(0)' }
    ], {
        duration: 1000,
        easing: 'ease-in-out'
    });

    // Animate the p element
    const p = document.querySelector('header p');
    p.animate([
        { opacity: 0, transform: 'translateY(-50px)' },
        { opacity: 1, transform: 'translateY(0)' }
    ], {
        duration: 1000,
        delay: 0,
        easing: 'ease-in-out'
    });
    const sections = document.querySelectorAll('section');

    // Create an Intersection Observer
    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    });

    // Observe each section
    sections.forEach(section => {
        observer.observe(section);
    });
});

