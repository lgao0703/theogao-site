(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canvas = document.createElement('canvas');
  canvas.id = 'fx';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);
  var ctx = canvas.getContext('2d', { alpha: true });

  var w = 0, h = 0, dpr = 1;
  var mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
  var t0 = performance.now();
  var lastPointer = 0;

  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(now) {
    var dark = isDark();
    var time = (now - t0) / 1000;
    if (!reduce) {
      if (now - lastPointer > 2400) {
        tx = 0.5 + Math.sin(time * 0.18) * 0.08;
        ty = 0.5 + Math.cos(time * 0.14) * 0.05;
      }
      mx += (tx - mx) * 0.05;
      my += (ty - my) * 0.05;
    }

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    var col = dark ? [150, 195, 230] : [80, 115, 165];
    var cx = w * (0.5 + (mx - 0.5) * 0.1);
    var cy = h * (0.42 + (my - 0.5) * 0.06);
    var rings = [
      { rx: 0.42, ry: 0.16, rot: time * 0.08, dash: false, a: 0.32 },
      { rx: 0.58, ry: 0.22, rot: -time * 0.05 + 0.4, dash: true, a: 0.22 },
      { rx: 0.28, ry: 0.28, rot: time * 0.03, dash: false, a: 0.2 }
    ];
    ctx.lineWidth = 1.15;
    for (var i = 0; i < rings.length; i++) {
      var r = rings[i];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(r.rot);
      ctx.strokeStyle = rgba(col, dark ? r.a : r.a + 0.04);
      if (r.dash) ctx.setLineDash([6, 10]);
      else ctx.setLineDash([]);
      ctx.beginPath();
      ctx.ellipse(0, 0, r.rx * Math.min(w, 1400), r.ry * Math.min(h * 1.2, 900), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      if (i < 2) {
        var ticks = 3;
        var rx = r.rx * Math.min(w, 1400);
        var ry = r.ry * Math.min(h * 1.2, 900);
        for (var k = 0; k < ticks; k++) {
          var ang = time * (0.4 + i * 0.15) + (k / ticks) * Math.PI * 2;
          var ex = Math.cos(ang) * rx;
          var ey = Math.sin(ang) * ry;
          var px = cx + ex * Math.cos(r.rot) - ey * Math.sin(r.rot);
          var py = cy + ex * Math.sin(r.rot) + ey * Math.cos(r.rot);
          ctx.fillStyle = rgba(col, dark ? 0.55 : 0.5);
          ctx.beginPath();
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (!reduce) requestAnimationFrame(draw);
  }

  window.addEventListener('pointermove', function (e) {
    lastPointer = performance.now();
    tx = e.clientX / window.innerWidth;
    ty = e.clientY / window.innerHeight;
  }, { passive: true });

  window.addEventListener('resize', resize);
  new MutationObserver(function () {
    if (reduce) draw(performance.now());
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  resize();
  draw(performance.now());
})();
