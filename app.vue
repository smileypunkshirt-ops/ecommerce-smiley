<template>
  <div class="app-shell">
    <NuxtPage />
    <CartToast />
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <p class="footer-brand">Smiley Punk</p>
          <p class="footer-text">Playeras esenciales para tu dia.</p>
        </div>
        <div>
          <p class="footer-title">Explorar</p>
          <NuxtLink class="footer-link" to="/">Catalogo</NuxtLink>
          <NuxtLink class="footer-link" to="/cart">Carrito</NuxtLink>
        </div>
        <div>
          <p class="footer-title">Soporte</p>
          <a class="footer-link" href="#">Envios</a>
          <a class="footer-link" href="#">Cambios</a>
        </div>
      </div>
    </footer>
  </div>
</template>
