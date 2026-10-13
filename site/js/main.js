/* Rossmann promosyon hikâyesi — grafikler data/ klasöründeki CSV/JSON dosyalarından çizilir.
   Elle yazılmış hiçbir veri değeri yoktur; sayılar dosyalardan okunur. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var D = null;          // yüklenen veriler
  var cur = 1;           // aktif adım
  var TOTAL = 7;
  var KAYNAK = 'Kaynak: Kaggle, Rossmann Store Sales · hesaplama: B. Özdizdar (notebook)';
  var KISA = { 'Pazartesi': 'Pzt', 'Salı': 'Sal', 'Çarşamba': 'Çar', 'Perşembe': 'Per', 'Cuma': 'Cum' };

  function $(id) { return document.getElementById(id); }
  function fmt(n, d) {
    d = d || 0;
    return Number(n).toLocaleString('tr-TR', { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  function mk(parent, name, attrs, text) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) { if (attrs[k] !== undefined) e.setAttribute(k, attrs[k]); }
    if (text !== undefined) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, cls, x, y, s, anchor, extra) {
    var a = { 'class': cls, x: x, y: y };
    if (anchor) a['text-anchor'] = anchor;
    if (extra) for (var k in extra) a[k] = extra[k];
    return mk(parent, 'text', a, s);
  }
  function parseCSV(t) {
    var lines = t.trim().split(/\r?\n/), head = lines[0].split(','), out = [];
    for (var i = 1; i < lines.length; i++) {
      var c = lines[i].split(','), o = {};
      for (var j = 0; j < head.length; j++) {
        var v = c[j]; o[head[j]] = (v !== '' && !isNaN(v)) ? Number(v) : v;
      }
      out.push(o);
    }
    return out;
  }
  function get(url, json) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url);
      return json ? r.json() : r.text().then(parseCSV);
    });
  }
  function quantile(sorted, q) {
    var p = (sorted.length - 1) * q, lo = Math.floor(p), hi = Math.ceil(p);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (p - lo);
  }
  function tickList(max, step) { var t = []; for (var v = 0; v <= max + 1e-9; v += step) t.push(v); return t; }
  function niceStep(max, n) {
    var raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    var s = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
    return s * p;
  }
  function arrowHead(x0, y0, x1, y1) {
    var a = Math.atan2(y1 - y0, x1 - x0), L = 11, w = 0.5;
    return 'M' + (x1 - L * Math.cos(a - w)) + ' ' + (y1 - L * Math.sin(a - w)) + ' L' + x1 + ' ' + y1 +
      ' L' + (x1 - L * Math.cos(a + w)) + ' ' + (y1 - L * Math.sin(a + w));
  }
  function layer(parent, s, cls) { return mk(parent, 'g', { 'data-s': s || undefined, 'class': cls || '' }); }

  /* ---------- ortak eksen çizimi (dikey çubuk / çizgi grafikleri) ---------- */
  function yAxis(parent, s, m, w, h, ymax, step, label, fmtTick) {
    var g = layer(parent, s);
    var ih = h - m.t - m.b;
    tickList(ymax, step).forEach(function (v) {
      var y = m.t + ih * (1 - v / ymax);
      mk(g, 'line', { 'class': 'izgara', x1: m.l, x2: w - m.r, y1: y, y2: y });
      txt(g, 'tik', m.l - 8, y + 5, fmtTick(v), 'end');
    });
    txt(g, 'eksenbaslik', 0, 0, label, 'middle', { transform: 'translate(15,' + (m.t + ih / 2) + ') rotate(-90)' });
    return g;
  }
  function source(svg, w, h) {
    txt(svg, 'kaynak', w - 4, h - 2, w < 520 ? 'Kaynak: Kaggle Rossmann Store Sales' : KAYNAK, 'end');
  }
  function margins(w) { return { l: w < 520 ? 76 : 80, r: w < 520 ? 14 : 26, t: 30, b: 76 }; }

  /* ---------- SAHNE (7 adım) ---------- */
  function buildStage() {
    var kap = $('grafikKap'), svg = $('grafik');
    var r = kap.getBoundingClientRect();
    var w = Math.round(r.width), h = Math.round(r.height);
    if (w < 80 || h < 80) return;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.innerHTML = '';
    var narrow = w < 520, m = margins(w), iw = w - m.l - m.r, ih = h - m.t - m.b;
    var G = D.genel, days = D.gun, types = D.tip, stores = D.magaza;
    var eur = function (v) { return fmt(v) + ' €'; };

    /* adım 1–2 : ortalama satış (€) */
    var ymax = 10000, step = 2500;
    var Y = function (v) { return m.t + ih * (1 - v / ymax); };
    var ax = yAxis(svg, '1 2', m, w, h, ymax, step, (narrow ? 'Günlük satış (€ / mağaza)' : 'Ortalama günlük satış (€ / mağaza)'), function (v) { return fmt(v); });
    var bw = Math.min(130, iw * 0.26), c1 = m.l + iw * 0.27, c2 = m.l + iw * 0.73;
    var ps = G.promosyonsuz_ort, pl = G.promosyonlu_ort;
    mk(svg, 'rect', { 'class': 'cubuk gri buyu', 'data-s': '1 2', x: c1 - bw / 2, y: Y(ps), width: bw, height: Y(0) - Y(ps) });
    txt(layer(svg, '1 2'), 'deger', c1, Y(ps) - 10, eur(ps), 'middle');
    txt(layer(svg, '1 2'), 'etiketx', c1, Y(0) + 24, 'Promosyonsuz', 'middle');
    mk(svg, 'rect', { 'class': 'cubuk kirmizi buyu', 'data-s': '2', x: c2 - bw / 2, y: Y(pl), width: bw, height: Y(0) - Y(pl) });
    txt(layer(svg, '2'), 'deger', c2, Y(pl) - 10, eur(pl), 'middle');
    txt(layer(svg, '2'), 'etiketx', c2, Y(0) + 24, 'Promosyonlu', 'middle');
    var a2 = layer(svg, '2');
    var sx = c1 + 40, sy = Y(ps) - 62, ex = c2 - bw / 2 + 6, ey = Y(pl) - 42;
    mk(a2, 'path', { 'class': 'cizim2 on', pathLength: 1, d: 'M' + sx + ' ' + sy + ' C' + (sx + 50) + ' ' + (sy - 30) + ' ' + (ex - 50) + ' ' + (ey - 20) + ' ' + ex + ' ' + ey });
    mk(a2, 'path', { 'class': 'cizim2 on', pathLength: 1, d: arrowHead(ex - 50, ey - 20, ex, ey) });
    txt(a2, 'buyuk' + (narrow ? ' kucuk' : ''), c1 - 6, Y(ps) - 62, '+%' + fmt(G.artis_yuzde, 0), 'middle');
    mk(svg, 'line', { 'class': 'cizgi ince', x1: m.l, x2: w - m.r, y1: Y(0), y2: Y(0), 'data-s': '1 2' });

    /* adım 3 : müşteri sayısı ve müşteri başına harcama */
    var ms = D.musteri, mp = ms[0], mq = ms[1];
    var items = [
      { ad: 'Müşteri sayısı (mağaza başına, günlük)', pct: G.musteri_artis_yuzde, det: fmt(mp.Musteri) + ' → ' + fmt(mq.Musteri) + ' müşteri' },
      { ad: 'Müşteri başına harcama', pct: G.sepet_artis_yuzde, det: fmt(mp.Sepet, 2) + ' € → ' + fmt(mq.Sepet, 2) + ' €' }
    ];
    var L = 16, xmax = 30, XR = w - 16 - 70, bh = 30;
    var X3 = function (v) { return L + (XR - L) * v / xmax; };
    var g3 = layer(svg, '3');
    tickList(xmax, 10).forEach(function (v) {
      mk(g3, 'line', { 'class': 'izgara', x1: X3(v), x2: X3(v), y1: m.t, y2: h - m.b });
      txt(g3, 'tik', X3(v), h - m.b + 20, '%' + v, 'middle');
    });
    txt(g3, 'eksenbaslik', (L + XR) / 2, h - m.b + 44, 'Promosyonlu günlerde artış (%)', 'middle');
    var blk = (ih - 6) / 2;
    items.forEach(function (it, i) {
      var top = m.t + i * blk;
      txt(g3, 'etiketx', L, top + 20, it.ad, 'start');
      txt(g3, 'soluk-yazi', L, top + 42, it.det, 'start');
      mk(svg, 'rect', { 'class': 'cubuk kirmizi buyux', 'data-s': '3', x: X3(0), y: top + 54, width: X3(it.pct) - X3(0), height: bh });
      txt(g3, 'deger', X3(it.pct) + 10, top + 54 + bh - 4, '+%' + fmt(it.pct, 0), 'start');
    });

    /* adım 4–5 : haftanın günleri */
    var y45 = 60, Y4 = function (v) { return m.t + ih * (1 - v / y45); };
    yAxis(svg, '4 5', m, w, h, y45, 20, (narrow ? 'Satış artışı (%)' : 'Promosyonlu günde satış artışı (%)'), function (v) { return '%' + v; });
    mk(svg, 'line', { 'class': 'cizgi ince', x1: m.l, x2: w - m.r, y1: Y4(0), y2: Y4(0), 'data-s': '4 5' });
    var slot = iw / days.length, bw4 = Math.min(76, slot * 0.62), cx = function (i) { return m.l + slot * (i + 0.5); };
    var gl = layer(svg, '4 5'), bars = [];
    days.forEach(function (d, i) {
      var b = mk(svg, 'rect', { 'class': 'cubuk acik gun buyu', 'data-s': '4 5', x: cx(i) - bw4 / 2, y: Y4(d.Artis_yuzde), width: bw4, height: Y4(0) - Y4(d.Artis_yuzde) });
      bars.push(b);
      txt(gl, 'etiketx', cx(i), Y4(0) + 24, narrow ? KISA[d.gun] : d.gun, 'middle');
      txt(gl, 'etiketx', cx(i), Y4(d.Artis_yuzde) - 8, '%' + fmt(d.Artis_yuzde, 0), 'middle');
    });
    svg._bars = bars;
    var iPzt = 0, iCum = days.length - 1;
    var t4 = layer(svg, '4');
    txt(t4, 'etiketx', cx(0) + bw4 / 2 + 12, Y4(days[0].Artis_yuzde) + 20, '← en yüksek etki', 'start', { fill: '#ff4a5c' });
    var t5 = layer(svg, '5');
    var yTop = Y4(days[iPzt].Artis_yuzde), yBot = Y4(days[iCum].Artis_yuzde), bx = cx(iCum) - slot / 2;
    mk(t5, 'line', { 'class': 'cizgi ince', 'stroke-dasharray': '6 5', x1: cx(0) + bw4 / 2, x2: cx(iCum) + bw4 / 2, y1: yTop, y2: yTop, stroke: '#ff4a5c' });
    mk(t5, 'path', { 'class': 'cizgi', stroke: '#ff4a5c', d: 'M' + bx + ' ' + (yTop + 2) + ' L' + bx + ' ' + (yBot - 2) + ' ' + arrowHead(bx, yTop + 30, bx, yTop + 2) + ' ' + arrowHead(bx, yBot - 30, bx, yBot - 2) });
    var fark = days[iPzt].Artis_yuzde - days[iCum].Artis_yuzde;
    txt(t5, 'etiketx', w - m.r, yTop - 8, '≈' + fmt(fark, 0) + ' puan fark', 'end', { fill: '#ff4a5c' });

    /* adım 6 : mağaza bazında dağılım (arı sürüsü grafiği) */
    var vals = stores.map(function (s) { return s.Artis_yuzde; }).sort(function (a, b) { return a - b; });
    var q1 = quantile(vals, 0.25), med = quantile(vals, 0.5), q3 = quantile(vals, 0.75), mn = vals[0], mx = vals[vals.length - 1];
    svg._stats = { q1: q1, med: med, q3: q3, mn: mn, mx: mx, n: vals.length };
    var X6 = function (v) { return m.l - 40 + (w - m.l - m.r + 80) * v / 110; };
    var g6 = layer(svg, '6');
    tickList(100, 20).forEach(function (v) {
      mk(g6, 'line', { 'class': 'izgara', x1: X6(v), x2: X6(v), y1: m.t + 40, y2: h - m.b });
      txt(g6, 'tik', X6(v), h - m.b + 20, '%' + v, 'middle');
    });
    txt(g6, 'eksenbaslik', w / 2, h - m.b + 44, (narrow ? 'Satış artışı (%) · her nokta bir mağaza' : 'Promosyonlu günde satış artışı (%) · her nokta bir mağaza'), 'middle');
    var cy = m.t + 40 + (h - m.b - m.t - 40) * 0.5, avail = (h - m.b - m.t - 40) * 0.46;
    var sw = swarm(vals, X6, avail);
    mk(g6, 'rect', { 'class': 'bant', x: X6(q1), y: m.t + 40, width: X6(q3) - X6(q1), height: h - m.b - m.t - 40 });
    var dots = mk(g6, 'g', { 'aria-hidden': 'true' });
    sw.pts.forEach(function (p) { mk(dots, 'circle', { 'class': 'pt', cx: p.x.toFixed(1), cy: (cy + p.y).toFixed(1), r: sw.r }); });
    mk(g6, 'line', { x1: X6(med), x2: X6(med), y1: m.t + 40, y2: h - m.b, stroke: '#ff4a5c', 'stroke-width': 2.6, 'stroke-dasharray': '8 6' });
    txt(g6, 'etiketx', X6(med), m.t + 14, 'ortanca: %' + fmt(med, 1), 'middle', { fill: '#ff4a5c' });
    txt(g6, 'soluk-yazi', X6(med), m.t + 34, 'yarısı %' + fmt(q1, 0) + '–%' + fmt(q3, 0), 'middle');
    var yl = cy - 36;
    txt(g6, 'soluk-yazi', Math.max(X6(mn) - 4, 4), yl, 'en düşük', 'start');
    txt(g6, 'soluk-yazi', Math.max(X6(mn) - 4, 4), yl + 20, '%' + fmt(mn, 1), 'start');
    txt(g6, 'soluk-yazi', Math.min(X6(mx) + 4, w - 4), yl, 'en yüksek', 'end');
    txt(g6, 'soluk-yazi', Math.min(X6(mx) + 4, w - 4), yl + 20, '%' + fmt(mx, 1), 'end');

    /* adım 7 : mağaza tipi */
    var y7 = 50, Y7 = function (v) { return m.t + ih * (1 - v / y7); };
    yAxis(svg, '7', m, w, h, y7, 10, (narrow ? 'Satış artışı (%)' : 'Promosyonlu günde satış artışı (%)'), function (v) { return '%' + v; });
    mk(svg, 'line', { 'class': 'cizgi ince', x1: m.l, x2: w - m.r, y1: Y7(0), y2: Y7(0), 'data-s': '7' });
    var slot7 = iw / types.length, bw7 = Math.min(90, slot7 * 0.6), c7 = function (i) { return m.l + slot7 * (i + 0.5); };
    var g7 = layer(svg, '7');
    types.forEach(function (t, i) {
      var isB = t.magaza_tipi === 'b';
      mk(svg, 'rect', { 'class': 'cubuk buyu ' + (isB ? 'kirmizi' : 'acik'), 'data-s': '7', x: c7(i) - bw7 / 2, y: Y7(t.Artis_yuzde), width: bw7, height: Y7(0) - Y7(t.Artis_yuzde) });
      txt(g7, 'etiketx', c7(i), Y7(t.Artis_yuzde) - 8, '%' + fmt(t.Artis_yuzde, 0), 'middle');
      txt(g7, 'etiketx', c7(i), Y7(0) + 22, t.magaza_tipi + ' tipi', 'middle');
      if (narrow) {
        txt(g7, 'soluk-yazi', c7(i), Y7(0) + 40, fmt(t.Magaza_sayisi), 'middle');
        txt(g7, 'soluk-yazi', c7(i), Y7(0) + 55, 'mağaza', 'middle');
      } else txt(g7, 'soluk-yazi', c7(i), Y7(0) + 42, fmt(t.Magaza_sayisi) + ' mağaza', 'middle');
      if (isB) {
        mk(g7, 'rect', { 'class': 'halka', x: c7(i) - bw7 / 2 - 8, y: Y7(t.Artis_yuzde) - 40, width: bw7 + 16, height: Y7(0) - Y7(t.Artis_yuzde) + 46, rx: 12 });
      }
    });
    source(svg, w, h);
    apply(cur, true);
  }

  /* arı sürüsü yerleşimi: noktalar üst üste binmeden x değerine göre dizilir */
  function swarm(vals, X, maxOff) {
    var r = 3.6, res;
    for (; r >= 1.5; r -= 0.3) {
      res = place(vals, X, r);
      if (res.max <= maxOff) break;
    }
    res.r = r;
    return res;
  }
  function place(vals, X, r) {
    var d = 2 * r + 0.6, pts = [], max = 0;
    vals.forEach(function (v) {
      var x = X(v), y = 0;
      for (var j = 0; j < 600; j++) {
        y = (j % 2 ? 1 : -1) * Math.ceil(j / 2) * (d * 0.3);
        var ok = true;
        for (var k = pts.length - 1; k >= 0; k--) {
          var p = pts[k];
          if (x - p.x >= d) break;
          var dx = x - p.x, dy = y - p.y;
          if (dx * dx + dy * dy < d * d) { ok = false; break; }
        }
        if (ok) break;
      }
      pts.push({ x: x, y: y });
      if (Math.abs(y) > max) max = Math.abs(y);
    });
    return { pts: pts, max: max, r: r };
  }

  /* ---------- adım metinleri (sayılar veriden) ---------- */
  function adimBilgi(n) {
    var G = D.genel, days = D.gun, types = D.tip, st = $('grafik')._stats;
    var pzt = days[0], cum = days[days.length - 1], b = null, diger = [];
    types.forEach(function (t) { if (t.magaza_tipi === 'b') b = t; else diger.push(t.Artis_yuzde); });
    var dmin = Math.min.apply(null, diger), dmax = Math.max.apply(null, diger);
    var ms = D.musteri;
    switch (n) {
      case 1: return ['Promosyonsuz hafta içi günlerde ortalama satış yaklaşık ' + fmt(G.promosyonsuz_ort) + ' €',
        'Çubuk grafik: promosyonsuz günlerde mağaza başına ortalama günlük satış ' + fmt(G.promosyonsuz_ort) + ' euro.'];
      case 2: return ['Promosyonlu günlerde ortalama satış ' + fmt(G.promosyonlu_ort) + ' €, yani yaklaşık %' + fmt(G.artis_yuzde, 0) + ' daha yüksek',
        'Çubuk grafik: promosyonsuz ' + fmt(G.promosyonsuz_ort) + ' euro, promosyonlu ' + fmt(G.promosyonlu_ort) + ' euro. Fark yaklaşık yüzde ' + fmt(G.artis_yuzde, 1) + '.'];
      case 3: return ['Promosyonlu günlerde müşteri sayısı yaklaşık %' + fmt(G.musteri_artis_yuzde, 0) + ', müşteri başına harcama yaklaşık %' + fmt(G.sepet_artis_yuzde, 0) + ' artıyor',
        'Yatay çubuk grafik: müşteri sayısı yüzde ' + fmt(G.musteri_artis_yuzde, 1) + ', müşteri başına harcama yüzde ' + fmt(G.sepet_artis_yuzde, 1) + ' artıyor.'];
      case 4: return ['Promosyonun etkisi en çok ' + pzt.gun.toLowerCase() + ' günü görülüyor: satışlar yaklaşık %' + fmt(pzt.Artis_yuzde, 0) + ' daha yüksek',
        'Çubuk grafik: promosyon kaynaklı satış artışı ' + days.map(function (d) { return d.gun + ' yüzde ' + fmt(d.Artis_yuzde, 1); }).join(', ') + '.'];
      case 5: return ['Etkinin en düşük olduğu gün ' + cum.gun.toLowerCase() + ' (%' + fmt(cum.Artis_yuzde, 0) + '); pazartesiyle arada yaklaşık ' + fmt(pzt.Artis_yuzde - cum.Artis_yuzde, 0) + ' puan fark var',
        'Aynı çubuk grafik; cuma yüzde ' + fmt(cum.Artis_yuzde, 1) + ', pazartesi yüzde ' + fmt(pzt.Artis_yuzde, 1) + '. Aradaki fark yaklaşık ' + fmt(pzt.Artis_yuzde - cum.Artis_yuzde, 0) + ' yüzde puanı.'];
      case 6: return [fmt(G.magaza_sayisi) + ' mağazanın ' + (G.dusen_magaza_sayisi === 0 ? 'hiçbirinde satış düşmedi' : 'bir kısmında satış düştü') + '; artış %' + fmt(st.mn, 0) + ' ile %' + fmt(st.mx, 0) + ' arasında değişiyor',
        'Nokta grafiği: ' + fmt(st.n) + ' mağazanın her biri bir nokta. Artış en düşük yüzde ' + fmt(st.mn, 1) + ', en yüksek yüzde ' + fmt(st.mx, 1) + ', ortanca yüzde ' + fmt(st.med, 1) + '. Mağazaların yarısı yüzde ' + fmt(st.q1, 1) + ' ile ' + fmt(st.q3, 1) + ' arasında.'];
      case 7: return ['a, c ve d tiplerinde artış yaklaşık %' + fmt(dmin, 0) + '–%' + fmt(dmax, 0) + '; b tipinde yalnızca yaklaşık %' + fmt(b.Artis_yuzde, 0) + ' (' + b.Magaza_sayisi + ' mağaza)',
        'Çubuk grafik: ' + types.map(function (t) { return t.magaza_tipi + ' tipi (' + t.Magaza_sayisi + ' mağaza) yüzde ' + fmt(t.Artis_yuzde, 1); }).join(', ') + '.'];
    }
  }

  function apply(n, force) {
    if (!D) return;
    if (n === cur && !force) return;
    cur = n;
    var svg = $('grafik');
    var info = adimBilgi(n);
    $('grafikBaslik').textContent = info[0];
    $('grafikOzet').textContent = info[1];
    $('sayacNo').textContent = n;
    document.querySelectorAll('.adim').forEach(function (a) {
      a.classList.toggle('aktif', +a.getAttribute('data-n') === n);
    });
    svg.querySelectorAll('[data-s]').forEach(function (e) {
      var on = e.getAttribute('data-s').split(' ').indexOf(String(n)) > -1;
      e.classList.toggle('on', on);
    });
    if (svg._bars) {
      svg._bars.forEach(function (b, i) {
        var last = svg._bars.length - 1;
        var focus = n === 4 ? (i === 0) : n === 5 ? (i === 0 || i === last) : true;
        b.classList.toggle('kirmizi', (n === 4 && i === 0) || (n === 5 && i === last));
        b.classList.toggle('acik', !((n === 4 && i === 0) || (n === 5 && i === last)));
        b.classList.toggle('soluk', !focus);
      });
    }
  }

  /* ---------- OKUYUCU KEŞFİ ---------- */
  function buildExplorer() {
    var svg = $('kesifgrafik'), r = svg.getBoundingClientRect();
    var w = Math.round(r.width), h = Math.round(r.height);
    if (w < 80) return;
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.innerHTML = '';
    var sel = $('tipSec').value, narrow = w < 520, m = margins(w); m.t = 46; m.b = 70;
    var rows, ad;
    if (sel === 'hepsi') { rows = D.gun; ad = 'Tüm mağazalarda'; }
    else { rows = D.tipgun.filter(function (x) { return x.magaza_tipi === sel; }); ad = sel + ' tipi mağazalarda'; }
    var iw = w - m.l - m.r, ih = h - m.t - m.b;
    var mx = Math.max.apply(null, rows.map(function (x) { return x.Promosyonlu; })) * 1.18;
    var st = niceStep(mx, 4), ymax = Math.ceil(mx / st) * st;
    var Y = function (v) { return m.t + ih * (1 - v / ymax); };
    var slot = iw / rows.length, X = function (i) { return m.l + slot * (i + 0.5); };
    yAxis(svg, '', m, w, h, ymax, st, (narrow ? 'Günlük satış (€ / mağaza)' : 'Ortalama günlük satış (€ / mağaza)'), function (v) { return fmt(v); });
    var g = mk(svg, 'g', {});
    rows.forEach(function (d, i) { txt(g, 'etiketx', X(i), h - m.b + 24, narrow ? KISA[d.gun] : d.gun, 'middle'); });
    txt(g, 'eksenbaslik', m.l + iw / 2, h - m.b + 48, 'Haftanın günü', 'middle');
    function path(key) { return rows.map(function (d, i) { return (i ? 'L' : 'M') + X(i) + ' ' + Y(d[key]); }).join(' '); }
    mk(g, 'path', { 'class': 'cizgi', stroke: '#a8a398', 'stroke-dasharray': '3 7', d: path('Promosyonsuz') });
    mk(g, 'path', { 'class': 'cizgi', stroke: '#ff4a5c', d: path('Promosyonlu') });
    var best = 0;
    rows.forEach(function (d, i) {
      mk(g, 'circle', { cx: X(i), cy: Y(d.Promosyonsuz), r: 5, fill: '#0a0a0a', stroke: '#a8a398', 'stroke-width': 2.4 });
      mk(g, 'circle', { cx: X(i), cy: Y(d.Promosyonlu), r: 5.5, fill: '#ff4a5c' });
      txt(g, 'etiketx', X(i), Y(d.Promosyonlu) - 12, '+%' + fmt(d.Artis_yuzde, 0), 'middle');
      if (d.Artis_yuzde > rows[best].Artis_yuzde) best = i;
    });
    var lx = 6, ly = 14;
    mk(g, 'path', { 'class': 'cizgi', stroke: '#ff4a5c', d: 'M' + lx + ' ' + ly + ' h28' });
    txt(g, 'etiketx', lx + 34, ly + 5, 'Promosyonlu', 'start');
    var lx2 = lx + (narrow ? 140 : 160);
    mk(g, 'path', { 'class': 'cizgi', stroke: '#a8a398', 'stroke-dasharray': '3 7', d: 'M' + lx2 + ' ' + ly + ' h28' });
    txt(g, 'etiketx', lx2 + 34, ly + 5, 'Promosyonsuz', 'start');
    source(svg, w, h);
    var ort = rows.reduce(function (a, d) { return a + d.Artis_yuzde; }, 0) / rows.length;
    var lo = 0; rows.forEach(function (d, i) { if (d.Artis_yuzde < rows[lo].Artis_yuzde) lo = i; });
    $('kesifBaslik').textContent = ad + ' promosyonlu günlerde satışlar, haftanın günlerine göre yaklaşık %' + fmt(rows[lo].Artis_yuzde, 0) + ' ile %' + fmt(rows[best].Artis_yuzde, 0) + ' arasında yükseliyor';
    var extra = '';
    if (sel !== 'hepsi') {
      var t = D.tip.filter(function (x) { return x.magaza_tipi === sel; })[0];
      extra = ' Bu tipte ' + fmt(t.Magaza_sayisi) + ' mağaza var' + (t.Magaza_sayisi < 30 ? '; mağaza sayısı az olduğu için sonucu dikkatli yorumlamak gerekir.' : '.');
    }
    $('kesifOzet').textContent = 'Etki en çok ' + rows[best].gun.toLowerCase() + ' günü (+%' + fmt(rows[best].Artis_yuzde, 1) + '), en az ' + rows[lo].gun.toLowerCase() + ' günü (+%' + fmt(rows[lo].Artis_yuzde, 1) + ') görülüyor.' + extra;
    svg.setAttribute('aria-label', $('kesifBaslik').textContent);
  }

  /* ---------- kaydırma gözlemcisi ---------- */
  var io = null, lastNarrow = null;
  function setupObserver() {
    var narrow = window.matchMedia('(max-width: 860px)').matches;
    if (io) io.disconnect();
    var active = new Set();
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) active.add(e.target); else active.delete(e.target); });
      var vh = window.innerHeight, target = vh * (narrow ? 0.7 : 0.5), best = null, bd = 1e9;
      active.forEach(function (a) {
        var r = a.querySelector('.kart').getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - target);
        if (d < bd) { bd = d; best = a; }
      });
      if (best) apply(+best.getAttribute('data-n'));
    }, { rootMargin: narrow ? '-60% 0px -20% 0px' : '-35% 0px -35% 0px' });
    document.querySelectorAll('.adim').forEach(function (a) { io.observe(a); });
    lastNarrow = narrow;
  }

  /* ---------- başlat ---------- */
  function hata() {
    $('grafikBaslik').textContent = 'Veriler yüklenemedi. Sayfayı bir web sunucusu üzerinden (ya da yayındaki adresten) açın.';
    $('kesifBaslik').textContent = 'Veriler yüklenemedi.';
  }
  var lw = 0, lh = 0, tmr;
  function rebuild() { buildStage(); buildExplorer(); }
  function onResize() {
    clearTimeout(tmr);
    tmr = setTimeout(function () {
      var w = window.innerWidth, h = window.innerHeight;
      if (w === lw && Math.abs(h - lh) < 120) return;   // mobil adres çubuğu oynamalarını yok say
      lw = w; lh = h;
      rebuild();
      if (window.matchMedia('(max-width: 860px)').matches !== lastNarrow) setupObserver();
    }, 150);
  }

  Promise.all([get('data/genel.json', true), get('data/hafta_gunu.csv'), get('data/magaza_tipi.csv'),
    get('data/magaza_bazinda.csv'), get('data/musteri_sepet.csv'), get('data/tip_gun.csv')])
    .then(function (a) {
      D = { genel: a[0], gun: a[1], tip: a[2], magaza: a[3], musteri: a[4], tipgun: a[5] };
      var sel = $('tipSec');
      sel.innerHTML = '';
      var o = document.createElement('option'); o.value = 'hepsi'; o.textContent = 'Tüm mağazalar'; sel.appendChild(o);
      D.tip.forEach(function (t) {
        var e = document.createElement('option'); e.value = t.magaza_tipi;
        e.textContent = t.magaza_tipi + ' tipi (' + fmt(t.Magaza_sayisi) + ' mağaza)'; sel.appendChild(e);
      });
      sel.addEventListener('change', buildExplorer);
      lw = window.innerWidth; lh = window.innerHeight;
      rebuild();
      setupObserver();
      window.addEventListener('resize', onResize);
    })
    .catch(hata);
})();
