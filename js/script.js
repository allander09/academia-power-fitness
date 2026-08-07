const menuMobile = document.querySelector(".menu-mobile");
const menu = document.querySelector("nav ul");

menuMobile.addEventListener("click", () => {
    menu.classList.toggle("ativo");
});