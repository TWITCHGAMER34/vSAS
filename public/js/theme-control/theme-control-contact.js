const icon = document.getElementById('theme-icon');
const theme = localStorage.getItem("theme") || "light";

const container = document.querySelector('.container');
const form = document.querySelector('form');
const input = document.querySelector('input');
const textarea = document.querySelector('textarea');
const label = document.querySelector('label');
const p = document.querySelector('.dark');
const count = document.querySelector('#word-count');

const toChange = [document.body, container, form, input, textarea, label, p, count]

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

const message = document.getElementById('message');
const wordCount = document.getElementById('word-count');

message.addEventListener('input', function(event) {
    const numChars = this.value.length;
    const remaining = 500 - numChars;
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';

    if (remaining < 0) {
        event.preventDefault();
        this.value = this.value.slice(0, 500);
        wordCount.textContent = '0 characters remaining';
    } else {
        wordCount.textContent = `${remaining} characters remaining`;
    }
});