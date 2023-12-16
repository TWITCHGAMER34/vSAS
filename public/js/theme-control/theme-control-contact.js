const icon = document.getElementById('theme-icon');
const theme = localStorage.getItem("theme") || "light";

const container = document.querySelector('.container');
const form = document.querySelector('form');
const input = document.querySelector('input');
const textarea = document.querySelector('textarea');
const label = document.querySelector('label');

const toChange = [document.body, container, form, input, textarea, label]

function changeTheme(newTheme) {
    icon.style.rotate = newTheme === "dark" ? "180deg" : "0deg";
    toChange.map(x => x.classList.toggle("dark-theme"))
}

if (theme === "dark") changeTheme("dark")
icon.addEventListener('click', function () {
    const newTheme = localStorage.getItem("theme") === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme)
    changeTheme(newTheme);
});