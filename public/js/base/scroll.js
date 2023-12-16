const nav = document.querySelector("nav")

window.addEventListener("scroll", () => {
    nav.style.opacity = this.scrollY > 600 ? "0" : "1";
    nav.style.scale = this.scrollY > 600 ? "0.95" : "1";
});