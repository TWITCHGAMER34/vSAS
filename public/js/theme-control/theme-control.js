const element = document.querySelector('#theme-icon');
const theme = localStorage.getItem("theme") || "light";
const burger = document.querySelector('.burger');
const nav = document.querySelector('nav ul');

function changeTheme(newTheme) {
    element.style.rotate = newTheme === "dark" ? "180deg" : "0deg";
    document.body.classList.toggle('dark-theme');
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.toggle('dark-theme');
    });
}

if (theme === "dark") changeTheme("dark")
element.addEventListener('click', function () {
    const newTheme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    changeTheme(newTheme);
});

burger.addEventListener('click', () => {
    nav.classList.toggle('show');
});
