const icon = document.querySelector('#theme-icon');
const about = document.querySelector('#about');
const content = document.querySelector('.content');

const theme = localStorage.getItem("theme") || "light";


function changeTheme(newTheme) {
    icon.style.rotate = newTheme === "dark" ? "180deg" : "0deg";
    document.body.classList.toggle('dark-theme');
    about.classList.toggle('dark-theme');
    content.classList.toggle('dark-theme');

    const textElements = document.querySelectorAll('.text');
    textElements.forEach(element => {
        element.classList.toggle('dark-theme');
    });
}

if (theme === "dark") changeTheme("dark")
icon.addEventListener('click', () => {
    const newTheme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme)
    changeTheme(newTheme);
});