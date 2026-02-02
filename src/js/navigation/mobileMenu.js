document.addEventListener("DOMContentLoaded", () => {
  const burger = document.querySelector(".burger-btn");
  const menu = document.querySelector(".mobile-menu");

  let startScrollPos = 0;

  burger.addEventListener("click", () => {
    burger.classList.toggle("active");
    menu.classList.toggle("open");

    if (menu.classList.contains("open")) {
      startScrollPos = window.scrollY;
    }
  });

  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      burger.classList.remove("active");
      menu.classList.remove("open");
    });
  });

  window.addEventListener("scroll", () => {
    if (menu.classList.contains("open")) {
      const currentScrollPos = window.scrollY;
      const distance = Math.abs(currentScrollPos - startScrollPos);

      if (distance > 100) {
        burger.classList.remove("active");
        menu.classList.remove("open");
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target) && !burger.contains(event.target)) {
      burger.classList.remove("active");
      menu.classList.remove("open");
    }
  });
});