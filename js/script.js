document.addEventListener("DOMContentLoaded", () => {
  const botaoMenu = document.querySelector(".menu-mobile");
  const menu = document.querySelector("nav ul");

  if (!botaoMenu || !menu) return;

  botaoMenu.addEventListener("click", () => {
    const aberto = menu.classList.toggle("ativo");
    botaoMenu.setAttribute("aria-expanded", String(aberto));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("ativo");
      botaoMenu.setAttribute("aria-expanded", "false");
    });
  });
});
