document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.main-header');
  const logo = document.querySelector("#headerLogo");
  const logoContainer = document.querySelector(".logo");

  const checkHeaderScroll = () => {
    if (header && window.scrollY > 0) {
      header.classList.add('scrolled');
      logo.src = "/images/logo.webp";
      logoContainer.classList.add("scrolled");
    }
    else if (header) {
      header.classList.remove('scrolled');
      logo.src = "/images/Prospect24-logo.png";
      logoContainer.classList.remove("scrolled");
    }
  };

  window.addEventListener('scroll', checkHeaderScroll);

  checkHeaderScroll();
});
