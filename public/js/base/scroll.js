const nav_el = document.querySelector("nav")

window.addEventListener("scroll", () => {
    nav_el.style.opacity = this.scrollY > 600 ? "0" : "1";
    nav_el.style.scale = this.scrollY > 600 ? "0.95" : "1";
});