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
  var particles = [];
  var lastPointer = 0;

  function isDark() {
    var t = document.documentElement.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
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
    var n = Math.round((w * h) / 12000);
    if (n < 50) n = 50;
    if (n > 140) n = 140;
    particles = [];
    for (var i = 0; i < n; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random() * 0.72,
        z: 0.25 + Math.random() * 0.75,
        r: 0.5 + Math.random() * 1.8,
        s: 0.12 + Math.random() * 0.5,
        p: Math.random() * Math.PI * 2
      });
    }
  }

  function rgba(rgb, a) {
    return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a + ')';
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

    var grid = dark ? [130, 215, 255] : [40, 95, 185];
    var warm = dark ? [170, 130, 255] : [230, 130, 80];
    var core = dark ? [90, 210, 255] : [70, 150, 255];
    var gridA = dark ? 0.34 : 0.32;
    var vpX = w * (0.5 + (mx - 0.5) * 0.22);
    var vpY = h * ((w < 768 ? 0.86 : 0.78) + (my - 0.5) * 0.04);

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    // Upper atmosphere
    var sky = ctx.createLinearGradient(0, 0, 0, vpY);
    if (dark) {
      sky.addColorStop(0, 'rgba(8, 12, 28, 0.35)');
      sky.addColorStop(1, 'rgba(20, 40, 80, 0.05)');
    } else {
      sky.addColorStop(0, 'rgba(190, 215, 245, 0.45)');
      sky.addColorStop(1, 'rgba(210, 180, 160, 0.12)');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, vpY);

    // Volumetric bloom at the vanishing point
    var bloomR = Math.max(w, h) * 0.7;
    var bloom = ctx.createRadialGradient(vpX, vpY, 0, vpX, vpY, bloomR);
    if (dark) {
      bloom.addColorStop(0, 'rgba(120, 220, 255, 0.62)');
      bloom.addColorStop(0.08, 'rgba(80, 170, 255, 0.32)');
      bloom.addColorStop(0.22, 'rgba(90, 80, 200, 0.12)');
      bloom.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
      bloom.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      bloom.addColorStop(0.06, 'rgba(140, 190, 255, 0.55)');
      bloom.addColorStop(0.16, 'rgba(255, 170, 120, 0.28)');
      bloom.addColorStop(0.4, 'rgba(160, 190, 230, 0.1)');
      bloom.addColorStop(1, 'rgba(0,0,0,0)');
    }
    ctx.fillStyle = bloom;
    ctx.fillRect(0, 0, w, h);

    // Light shafts from the horizon
    if (dark) ctx.globalCompositeOperation = 'lighter';
    ctx.save();
    ctx.translate(vpX, vpY);
    var shafts = 6;
    for (var s = 0; s < shafts; s++) {
      var ang = -Math.PI + (s / (shafts - 1)) * Math.PI;
      ang += Math.sin(time * 0.25 + s) * 0.04;
      var spread = 0.07 + (s % 2) * 0.03;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang - spread) * h, Math.sin(ang - spread) * h);
      ctx.lineTo(Math.cos(ang + spread) * h, Math.sin(ang + spread) * h);
      ctx.closePath();
      var shaftA = (dark ? 0.055 : 0.045) * (0.7 + 0.3 * Math.sin(time * 0.6 + s));
      ctx.fillStyle = rgba(core, shaftA);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalCompositeOperation = 'source-over';

    // Particles / stars in the sky
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var px = p.x * w + (mx - 0.5) * 28 * p.z;
      var py = p.y * vpY + Math.sin(time * p.s + p.p) * 6;
      if (!reduce) p.x += 0.00015 * p.s;
      if (p.x > 1.05) p.x = -0.05;
      var tw = reduce ? 1 : 0.55 + 0.45 * Math.sin(time * (1.2 + p.s) + p.p);
      var a = (dark ? 0.7 : 0.45) * p.z * tw;
      ctx.beginPath();
      ctx.fillStyle = rgba(dark ? [210, 235, 255] : [50, 100, 190], a);
      ctx.arc(px, py, p.r * p.z, 0, Math.PI * 2);
      ctx.fill();
    }

    // Floor
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, vpY, w, h - vpY + 2);
    ctx.clip();

    var floor = ctx.createLinearGradient(0, vpY, 0, h);
    if (dark) {
      floor.addColorStop(0, 'rgba(20, 50, 90, 0.18)');
      floor.addColorStop(1, 'rgba(4, 8, 16, 0.55)');
    } else {
      floor.addColorStop(0, 'rgba(170, 200, 240, 0.28)');
      floor.addColorStop(1, 'rgba(200, 210, 230, 0.08)');
    }
    ctx.fillStyle = floor;
    ctx.fillRect(0, vpY, w, h - vpY);

    var pulse = reduce ? -1 : (time % 9) / 9;
    var rows = 24;
    var cols = 22;
    var span = w * 1.55;

    // Horizontal lines
    for (var r = 1; r <= rows; r++) {
      var z = r / rows;
      var y = vpY + (h - vpY) * Math.pow(z, 1.7);
      var hit = pulse < 0 ? 0 : 1 - Math.min(1, Math.abs(z - pulse) / 0.08);
      var a = gridA * (0.2 + 0.8 * z) + hit * (dark ? 0.55 : 0.4);
      ctx.strokeStyle = rgba(hit > 0.2 ? (dark ? [180, 240, 255] : [30, 80, 200]) : grid, a);
      ctx.lineWidth = 1 + hit * 1.4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Vertical lines converging to the vanishing point
    for (var c = 0; c <= cols; c++) {
      var x = vpX + ((c / cols) - 0.5) * span * 2;
      var edge = 1 - Math.abs((c / cols) - 0.5) * 0.5;
      ctx.strokeStyle = rgba(grid, gridA * 0.95 * edge);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(x, h + 60);
      ctx.stroke();
    }

    // Traveling pulse as a bright band across the floor
    if (pulse >= 0) {
      var py2 = vpY + (h - vpY) * Math.pow(pulse, 1.7);
      var band = ctx.createRadialGradient(vpX, py2, 0, vpX, py2, w * 0.55);
      band.addColorStop(0, rgba(dark ? [200, 245, 255] : [60, 120, 255], dark ? 0.55 : 0.35));
      band.addColorStop(0.4, rgba(core, dark ? 0.18 : 0.12));
      band.addColorStop(1, 'rgba(0,0,0,0)');
      if (dark) ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = band;
      ctx.fillRect(0, vpY, w, h - vpY);
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();

    // Horizon line + holographic fringe
    var hz = ctx.createLinearGradient(0, vpY, w, vpY);
    hz.addColorStop(0, 'rgba(0,0,0,0)');
    hz.addColorStop(0.25, rgba(warm, dark ? 0.35 : 0.3));
    hz.addColorStop(0.5, rgba(core, dark ? 0.95 : 0.7));
    hz.addColorStop(0.75, rgba(warm, dark ? 0.35 : 0.3));
    hz.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = hz;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, vpY);
    ctx.lineTo(w, vpY);
    ctx.stroke();

    // Horizon glow strip
    var strip = ctx.createLinearGradient(0, vpY - 18, 0, vpY + 28);
    strip.addColorStop(0, 'rgba(0,0,0,0)');
    strip.addColorStop(0.5, rgba(core, dark ? 0.28 : 0.22));
    strip.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = strip;
    ctx.fillRect(0, vpY - 18, w, 46);

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
