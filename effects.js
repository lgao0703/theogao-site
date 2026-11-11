(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var x = 70, y = 10, tx = 70, ty = 10;
  window.addEventListener('pointermove', function (e) {
    tx = (e.clientX / window.innerWidth) * 100;
    ty = (e.clientY / window.innerHeight) * 100;
  }, { passive: true });
  function tick() {
    x += (tx - x) * 0.06;
    y += (ty - y) * 0.06;
    document.body.style.setProperty('--spot-x', x.toFixed(2) + '%');
    document.body.style.setProperty('--spot-y', y.toFixed(2) + '%');
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
