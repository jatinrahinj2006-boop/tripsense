/* ============================================================
   TripSense — Enhancements
   All updates from Updates.txt implemented as a drop-in file.
   Add <script src="enhancements.js"></script> AFTER script.js.
   Does NOT modify script.js at all.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. SCROLL-AWARE NAVBAR ───────────────────────────────────
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });


  // ── 2. DESTINATION CARD PARALLAX TILT ───────────────────────
  document.querySelectorAll('.dest-card').forEach(card => {
    card.style.transformStyle = 'preserve-3d';
    card.style.perspective = '800px';
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease';
    });
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-8px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
      card.style.transform = 'translateY(0) rotateY(0) rotateX(0) scale(1)';
    });
  });


  // ── 3. TOAST NOTIFICATION SYSTEM ────────────────────────────
  // Exposed globally so other code can call showToast()
  window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { error: 'alert-circle', success: 'check-circle', info: 'info' };
    toast.innerHTML = `<i data-lucide="${icons[type] || 'info'}"></i><span>${message}</span>`;
    container.appendChild(toast);
    if (window.lucide) lucide.createIcons({ el: toast });
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(60px) scale(0.9)'; setTimeout(() => toast.remove(), 350); }, 3800);
  };


  // ── 4. RECENT SEARCHES ───────────────────────────────────────
  function getRecentSearches() {
    try { return JSON.parse(localStorage.getItem('ts_recent') || '[]'); } catch { return []; }
  }
  function saveRecentSearch(city) {
    let recent = getRecentSearches().filter(c => c.toLowerCase() !== city.toLowerCase());
    recent.unshift(city);
    recent = recent.slice(0, 5);
    localStorage.setItem('ts_recent', JSON.stringify(recent));
    renderRecentSearches();
  }
  function renderRecentSearches() {
    const recent = getRecentSearches();
    const wrap = document.getElementById('recentSearches');
    const list = document.getElementById('recentList');
    if (!wrap || !list) return;
    if (!recent.length) { wrap.classList.add('hidden'); return; }
    wrap.classList.remove('hidden');
    list.innerHTML = recent.map(city =>
      `<button class="recent-chip" onclick="quickSearch('${city}')">
        <i data-lucide="clock" style="width:12px;height:12px;flex-shrink:0"></i>${city}
      </button>`
    ).join('');
    if (window.lucide) lucide.createIcons({ el: list });
  }
  window._saveRecentSearch = saveRecentSearch;
  renderRecentSearches();


  // ── 5. KEYBOARD SHORTCUTS ────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== cityInput) {
      e.preventDefault();
      cityInput?.focus();
      showToast('Search focused — type a city!', 'info');
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    }
  });


  // ── 6. COUNT-UP ANIMATION ────────────────────────────────────
  window.animateValue = function(el, start, end, duration, suffix = '') {
    if (!el || isNaN(end)) return;
    const startTime = performance.now();
    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (end - start) * eased) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  };


  // ── 7. TRAVEL SCORE RING ─────────────────────────────────────
  window.getTravelScore = function(data) {
    let score = 100;
    score -= (data.aqi - 1) * 12;
    if (data.temp > 42) score -= 20; else if (data.temp > 38) score -= 10;
    else if (data.temp < -5) score -= 15; else if (data.temp < 5) score -= 5;
    if (data.humidity > 90) score -= 10; else if (data.humidity > 80) score -= 5;
    if (data.windSpeed > 15) score -= 10; else if (data.windSpeed > 10) score -= 5;
    score = Math.max(0, Math.min(100, score));
    let label, color;
    if (score >= 80) { label = 'Excellent'; color = '#10b981'; }
    else if (score >= 60) { label = 'Good'; color = '#f59e0b'; }
    else if (score >= 40) { label = 'Moderate'; color = '#f97316'; }
    else { label = 'Challenging'; color = '#ef4444'; }
    return { score, label, color };
  };

  window.displayTravelScore = function(data) {
    const { score, label, color } = getTravelScore(data);
    const numEl = document.getElementById('scoreNumber');
    const ring = document.getElementById('scoreRingFill');
    const labelEl = document.getElementById('scoreLabel');
    if (!numEl || !ring) return;
    numEl.textContent = score;
    ring.style.stroke = color;
    if (labelEl) { labelEl.textContent = label; labelEl.style.color = color; }
    setTimeout(() => ring.setAttribute('stroke-dasharray', `${score}, 100`), 200);
  };


  // ── 8. LOCAL TIME + SUNRISE/SUNSET ──────────────────────────
  let _timeInterval;
  window.updateTimeInfo = function(data) {
    clearInterval(_timeInterval);
    function renderTime() {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const local = new Date(utc + (data.timezone || 0) * 1000);
      const el = document.getElementById('localTime');
      if (el) el.textContent = local.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }
    renderTime();
    _timeInterval = setInterval(renderTime, 60000);

    if (data.sunrise && data.sunset) {
      const tz = data.timezone || 0;
      const sr = new Date((data.sunrise + tz) * 1000);
      const ss = new Date((data.sunset  + tz) * 1000);
      const opts = { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' };
      const srEl = document.getElementById('sunriseTime');
      const ssEl = document.getElementById('sunsetTime');
      if (srEl) srEl.textContent = sr.toLocaleTimeString('en-US', opts);
      if (ssEl) ssEl.textContent = ss.toLocaleTimeString('en-US', opts);
    }
    const visEl = document.getElementById('visibilityValue');
    if (visEl && data.visibility) visEl.textContent = `${(data.visibility / 1000).toFixed(1)} km`;
  };


  // ── 9. COMPARE CITIES MODAL ─────────────────────────────────
  const apiKey = 'ea0fca7e491fa7f02d2db5d62c66f187'; // same key as script.js

  async function compareCities() {
    const city1 = document.getElementById('compareCity1')?.value.trim();
    const city2 = document.getElementById('compareCity2')?.value.trim();
    if (!city1 || !city2) { showToast('Please enter both cities', 'error'); return; }

    const resultsDiv = document.getElementById('compareResults');
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '<p style="text-align:center;color:var(--text-gray);padding:1rem">Comparing…</p>';
    resultsDiv.classList.remove('hidden');

    try {
      const [geo1, geo2] = await Promise.all([
        fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city1}&limit=1&appid=${apiKey}`).then(r => r.json()),
        fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city2}&limit=1&appid=${apiKey}`).then(r => r.json()),
      ]);
      if (!geo1.length || !geo2.length) {
        resultsDiv.innerHTML = '<p style="text-align:center;color:#ef4444;">One or both cities not found.</p>';
        return;
      }
      const [w1, w2, aq1, aq2] = await Promise.all([
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${geo1[0].lat}&lon=${geo1[0].lon}&units=metric&appid=${apiKey}`).then(r => r.json()),
        fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${geo2[0].lat}&lon=${geo2[0].lon}&units=metric&appid=${apiKey}`).then(r => r.json()),
        fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${geo1[0].lat}&lon=${geo1[0].lon}&appid=${apiKey}`).then(r => r.json()),
        fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${geo2[0].lat}&lon=${geo2[0].lon}&appid=${apiKey}`).then(r => r.json()),
      ]);
      const d1 = { name: geo1[0].name, temp: Math.round(w1.main.temp), humidity: w1.main.humidity, wind: w1.wind.speed.toFixed(1), aqi: aq1.list[0].main.aqi };
      const d2 = { name: geo2[0].name, temp: Math.round(w2.main.temp), humidity: w2.main.humidity, wind: w2.wind.speed.toFixed(1), aqi: aq2.list[0].main.aqi };
      const aqiLabels = { 1:'Good',2:'Fair',3:'Moderate',4:'Poor',5:'Very Poor' };
      const rows = [
        { label:'Temperature', k:'temp', suffix:'°C', lower:false },
        { label:'Humidity',    k:'humidity', suffix:'%', lower:true },
        { label:'Wind Speed',  k:'wind', suffix:' m/s', lower:true },
        { label:'Air Quality', k:'aqi', suffix:'', lower:true, sub:true },
      ];
      let html = `<div class="compare-city-header">${d1.name}</div><div></div><div class="compare-city-header">${d2.name}</div>`;
      rows.forEach(row => {
        const v1 = d1[row.k], v2 = d2[row.k];
        const b1 = row.lower ? v1 <= v2 : v1 >= v2;
        html += `
          <div class="compare-cell ${b1 ? 'compare-winner' : ''}">
            <div class="compare-cell-value">${v1}${row.suffix}</div>
            ${row.sub ? `<div class="compare-cell-sub">${aqiLabels[v1]||''}</div>` : ''}
          </div>
          <div class="compare-row-label">${row.label}</div>
          <div class="compare-cell ${!b1 ? 'compare-winner' : ''}">
            <div class="compare-cell-value">${v2}${row.suffix}</div>
            ${row.sub ? `<div class="compare-cell-sub">${aqiLabels[v2]||''}</div>` : ''}
          </div>`;
      });
      resultsDiv.innerHTML = html;
    } catch(err) {
      resultsDiv.innerHTML = '<p style="text-align:center;color:#ef4444">Error. Please try again.</p>';
      console.error(err);
    }
  }

  document.getElementById('compareBtn')?.addEventListener('click', () => {
    document.getElementById('compareModal')?.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  });
  document.getElementById('closeCompareModal')?.addEventListener('click', () =>
    document.getElementById('compareModal')?.classList.add('hidden'));
  document.getElementById('compareModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'compareModal') document.getElementById('compareModal')?.classList.add('hidden');
  });
  document.getElementById('runCompare')?.addEventListener('click', compareCities);


  // ── 10. HOOK INTO RESULTS DISPLAY ────────────────────────────
  // Intercept the resultsSection becoming visible to run all our enhancements
  const resultsEl = document.getElementById('resultsSection');
  if (resultsEl) {
    new MutationObserver(() => {
      if (!resultsEl.classList.contains('hidden')) {
        const data = window.currentCityData;
        if (!data) return;

        // Count-up animations
        const aqiEl   = document.getElementById('aqiValue');
        const tempEl  = document.getElementById('tempValue');
        const humEl   = document.getElementById('humidityValue');
        if (aqiEl && !isNaN(data.aqi))      animateValue(aqiEl, 0, data.aqi, 900);
        if (tempEl && !isNaN(data.temp))    animateValue(tempEl, 0, data.temp, 900, '°C');
        if (humEl && !isNaN(data.humidity)) animateValue(humEl, 0, data.humidity, 900, '%');

        // Dynamic progress bars
        setTimeout(() => {
          const aqiBar  = document.querySelector('.aqi-bar');
          const tempBar = document.querySelector('.temp-bar');
          const humBar  = document.querySelector('.humidity-bar');
          if (aqiBar)  { aqiBar.style.transition  = 'width 1s cubic-bezier(0.4,0,0.2,1)'; aqiBar.style.width  = `${Math.min((data.aqi / 5) * 100, 100)}%`; }
          if (tempBar) { tempBar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)'; tempBar.style.width = `${Math.min(Math.max((data.temp / 50) * 100, 5), 100)}%`; }
          if (humBar)  { humBar.style.transition  = 'width 1s cubic-bezier(0.4,0,0.2,1)'; humBar.style.width  = `${data.humidity}%`; }
        }, 300);

        // Travel score ring
        displayTravelScore(data);

        // Local time (needs timezone from weatherData — best effort)
        updateTimeInfo(data);

        // Recent searches
        _saveRecentSearch(data.city);

        // Toast welcome
        showToast(`Loaded data for ${data.city} 🌍`, 'success');

        // Re-run scroll reveal on new cards
        setTimeout(() => {
          document.querySelectorAll('.reveal:not(.active)').forEach(el => revealObserver?.observe(el));
        }, 150);

        // Auto-scroll
        setTimeout(() => resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
      }
    }).observe(resultsEl, { attributes: true, attributeFilter: ['class'] });
  }

}); // end DOMContentLoaded
