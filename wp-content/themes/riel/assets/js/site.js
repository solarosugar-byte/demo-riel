(function () {
	'use strict';
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	/* Ora di Milano */
	function romeNow() {
		var p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
		var o = {}; p.forEach(function (x) { o[x.type] = x.value; });
		var d = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
		return { d: d, m: (+o.hour % 24) * 60 + (+o.minute) };
	}
	/* Orari: [apertura, chiusura] in minuti */
	var WEEK = [8 * 60 + 30, 12 * 60 + 30, 14 * 60 + 30, 18 * 60 + 30];
	var H = { 0: [], 1: WEEK, 2: WEEK, 3: WEEK, 4: WEEK, 5: WEEK, 6: [600, 780] };
	var NOMI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
	function fmt(m) { var h = Math.floor(m / 60), mm = m % 60; return h + (mm ? ':' + String(mm).padStart(2, '0') : ''); }

	var now = romeNow(), label, open = false;
	var slots = H[now.d];
	for (var i = 0; i < slots.length; i += 2) {
		if (now.m >= slots[i] && now.m < slots[i + 1]) { open = true; label = 'Aperto ora · chiude alle ' + fmt(slots[i + 1]); }
	}
	if (!open) {
		for (var j = 0; j < slots.length; j += 2) {
			if (now.m < slots[j]) { label = 'Chiuso ora · riapre alle ' + fmt(slots[j]); break; }
		}
		if (!label) {
			for (var k = 1; k <= 7; k++) {
				var dd = (now.d + k) % 7;
				if (H[dd].length) { label = 'Chiuso ora · riapre ' + (k === 1 ? 'domani' : NOMI[dd]) + ' alle ' + fmt(H[dd][0]); break; }
			}
		}
	}
	document.querySelectorAll('[data-open-status]').forEach(function (el) {
		el.classList.add(open ? 'is-open' : 'is-closed');
		var l = el.querySelector('.rl-open-label');
		if (l) { l.textContent = label; }
	});
	var today = document.querySelector('.rl-hours tr[data-d="' + now.d + '"]');
	if (today) { today.classList.add('is-today'); }

	/* Display della lavatrice */
	var disp = document.querySelector('[data-cycle]');
	if (disp && !reduce) {
		var words = disp.getAttribute('data-cycle').split('|'), w = 0;
		setInterval(function () { w = (w + 1) % words.length; disp.textContent = words[w]; }, 2200);
	}

	/* Comparsa allo scorrimento */
	var els = document.querySelectorAll('.reveal, .rl-item, .rl-label');
	if (reduce || !('IntersectionObserver' in window)) {
		els.forEach(function (e) { e.classList.add('in'); });
	} else {
		var io = new IntersectionObserver(function (en) {
			en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
		}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
		els.forEach(function (e) {
			var r = e.getBoundingClientRect();
			if (r.top < window.innerHeight && r.bottom > 0) { e.classList.add('in'); } else { io.observe(e); }
		});
	}

	/* Filtro vetrina */
	document.querySelectorAll('.rl-chip').forEach(function (c) {
		c.addEventListener('click', function () {
			var f = c.getAttribute('data-f');
			document.querySelectorAll('.rl-chip').forEach(function (x) { x.classList.toggle('is-on', x === c); });
			document.querySelectorAll('.rl-item').forEach(function (it) {
				it.classList.toggle('is-hidden', f !== 'tutti' && it.getAttribute('data-tipo') !== f);
			});
		});
	});

	/* Scheda guasto → WhatsApp */
	var form = document.querySelector('[data-wa-form]');
	if (form) {
		var t = form.querySelector('[data-ticket]');
		if (t) { t.textContent = String(Math.floor(Math.random() * 9000) + 1000); }
		form.addEventListener('submit', function (ev) {
			ev.preventDefault();
			var d = new FormData(form);
			var txt = 'Ciao Carlo, ho un guasto.\n' +
				'Elettrodomestico: ' + d.get('app') + (d.get('marca') ? ' (' + d.get('marca') + ')' : '') + '\n' +
				(d.get('guasto') ? 'Cosa succede: ' + d.get('guasto') + '\n' : '') +
				(d.get('zona') ? 'Zona: ' + d.get('zona') : '');
			window.open('https://wa.me/' + form.getAttribute('data-wa-form') + '?text=' + encodeURIComponent(txt.trim()), '_blank', 'noopener');
		});
	}

	/* Contatori */
	document.querySelectorAll('[data-count]').forEach(function (el) {
		if (reduce) { return; }
		var n = +el.getAttribute('data-count'), s = null;
		function step(ts) { if (!s) { s = ts; } var p = Math.min((ts - s) / 1200, 1); el.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) { requestAnimationFrame(step); } }
		requestAnimationFrame(step);
	});
})();
