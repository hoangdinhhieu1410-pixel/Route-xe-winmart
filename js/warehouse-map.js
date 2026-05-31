// ============================================
// 🏭 WAREHOUSE MAP CONTROLLER
// ============================================

const WarehouseMap = (() => {
  let map;
  let markers = [];
  let markerLayer;
  let selectedProvinces = new Set();
  let selectedTypes = new Set();
  let openDropdown = null;

  // Province colors — vibrant & high-contrast
  const PROVINCE_COLORS = {
    'Vĩnh Phúc': '#536DFE',
    'Hà Nam': '#E040FB',
    'Ninh Bình': '#00BFA5',
    'Nam Định': '#FFD740',
    'Yên Bái': '#FF5252',
    'Sơn La': '#69F0AE',
    'Lào Cai': '#40C4FF',
    'Phú Thọ': '#FF4081',
    'Hòa Bình': '#B388FF',
    'Lai Châu': '#FFAB40',
    'Điện Biên': '#64FFDA'
  };

  function init() {
    // Merge Winmart stores into warehouse data
    if (typeof WINMART_STORES !== 'undefined') {
      WINMART_STORES.forEach(s => {
        GHN_WAREHOUSES.push({
          id: 1000 + s.id,
          name: s.name.replace(/,$/, ''),
          type: 'WM',
          province: s.province,
          district: s.district,
          lat: s.lat,
          lng: s.lng,
          om: ''
        });
      });
      GHN_STATS.total = GHN_WAREHOUSES.length;
      GHN_STATS.provinces = [...new Set(GHN_WAREHOUSES.map(w => w.province))];
      GHN_STATS.types['WM'] = 'Cửa hàng Winmart';
      GHN_STATS.typeColors['WM'] = '#76FF03';
      GHN_STATS.typeIcons['WM'] = '🏪';
    }

    // Init map
    map = L.map('wh-map', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([21.2, 105.0], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18
    }).addTo(map);

    markerLayer = L.layerGroup().addTo(map);

    // Build filters
    const provinces = GHN_STATS.provinces;
    provinces.forEach(p => selectedProvinces.add(p));
    Object.keys(GHN_STATS.types).forEach(t => selectedTypes.add(t));

    buildProvinceFilter(provinces);
    buildTypeFilter();
    renderKPIs();
    renderMap();
    renderTable();

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.wh-filter-group')) {
        closeAllDropdowns();
      }
    });
  }

  function buildProvinceFilter(provinces) {
    const list = document.getElementById('province-filter-list');
    list.innerHTML = provinces.map(p => {
      const color = PROVINCE_COLORS[p] || '#888';
      return `<label>
        <input type="checkbox" data-province="${p}" checked onchange="WarehouseMap.onProvChange()">
        <span class="wh-type-dot" style="background:${color}"></span>
        ${p}
      </label>`;
    }).join('');
  }

  function buildTypeFilter() {
    const list = document.getElementById('type-filter-list');
    const types = GHN_STATS.types;
    const colors = GHN_STATS.typeColors;
    const svgIcons = {
      BC: `<svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="${colors.BC}" stroke="#fff" stroke-width="1.5"/><circle cx="8" cy="8" r="2" fill="#fff"/></svg>`,
      KTC: `<svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,1 15,8 8,15 1,8" fill="${colors.KTC}" stroke="#fff" stroke-width="1.5"/></svg>`,
      GXT: `<svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,1 15,14 1,14" fill="${colors.GXT}" stroke="#fff" stroke-width="1.5"/></svg>`
    };
    list.innerHTML = Object.entries(types).map(([key, name]) => {
      return `<label>
        <input type="checkbox" data-type="${key}" checked onchange="WarehouseMap.onTypeChange()">
        ${svgIcons[key]}
        ${name} (${key})
      </label>`;
    }).join('');
  }

  function renderKPIs() {
    const grid = document.getElementById('wh-kpi-grid');
    const filtered = getFiltered();
    const bcCount = filtered.filter(w => w.type === 'BC').length;
    const ktcCount = filtered.filter(w => w.type === 'KTC').length;
    const gxtCount = filtered.filter(w => w.type === 'GXT').length;
    const provCount = new Set(filtered.map(w => w.province)).size;

    grid.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-icon">🏭</div>
        <div class="kpi-value">${filtered.length}</div>
        <div class="kpi-label">Tổng Kho</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">📮</div>
        <div class="kpi-value" style="color:${GHN_STATS.typeColors.BC}">${bcCount}</div>
        <div class="kpi-label">Bưu Cục</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🏪</div>
        <div class="kpi-value" style="color:${GHN_STATS.typeColors.WM}">${filtered.filter(w => w.type === 'WM').length}</div>
        <div class="kpi-label">Winmart</div>
      </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🏭</div>
        <div class="kpi-value" style="color:${GHN_STATS.typeColors.KTC}">${ktcCount}</div>
        <div class="kpi-label">Kho Chuyển Tiếp</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🚛</div>
        <div class="kpi-value" style="color:${GHN_STATS.typeColors.GXT}">${gxtCount}</div>
        <div class="kpi-label">Kho Giao Xe Tải</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">🏛️</div>
        <div class="kpi-value" style="color:var(--accent-purple)">${provCount}</div>
        <div class="kpi-label">Tỉnh/TP</div>
      </div>
    `;
  }

  function getFiltered() {
    return GHN_WAREHOUSES.filter(w =>
      selectedProvinces.has(w.province) && selectedTypes.has(w.type)
    );
  }

  function createMarkerIcon(type, province) {
    const color = GHN_STATS.typeColors[type] || '#888';
    const provColor = PROVINCE_COLORS[province] || '#888';

    if (type === 'KTC') {
      // ★ Kho Chuyển Tiếp — large diamond shape
      return L.divIcon({
        className: 'wh-marker-ktc',
        html: `<div style="position:relative;width:32px;height:32px;">
          <svg width="32" height="32" viewBox="0 0 32 32">
            <polygon points="16,2 30,16 16,30 2,16" fill="${color}" stroke="#fff" stroke-width="2.5"/>
            <text x="16" y="19" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">K</text>
          </svg>
          <div style="position:absolute;top:-2px;left:-2px;width:36px;height:36px;border-radius:50%;
            background:${color}30;filter:blur(6px);z-index:-1;animation:pulse-glow 2s infinite"></div>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
    }

    if (type === 'GXT') {
      // ★ Kho Giao Xe Tải — large triangle pointing up
      return L.divIcon({
        className: 'wh-marker-gxt',
        html: `<div style="position:relative;width:30px;height:30px;">
          <svg width="30" height="30" viewBox="0 0 30 30">
            <polygon points="15,2 28,26 2,26" fill="${color}" stroke="#fff" stroke-width="2.5"/>
            <text x="15" y="22" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">G</text>
          </svg>
          <div style="position:absolute;top:-2px;left:-2px;width:34px;height:34px;border-radius:50%;
            background:${color}30;filter:blur(6px);z-index:-1;animation:pulse-glow 2.5s infinite"></div>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });
    }

    // ★ Bưu Cục — circle with inner dot
    if (type === 'BC') {
      return L.divIcon({
        className: 'wh-marker-bc',
        html: `<div style="
          width:18px; height:18px; border-radius:50%;
          background:${color}; border:2.5px solid #fff;
          box-shadow: 0 0 10px ${color}90, 0 2px 6px rgba(0,0,0,0.4);
          transition: transform 0.2s ease;
          display:flex; align-items:center; justify-content:center;
        "><div style="width:6px;height:6px;border-radius:50%;background:#fff;opacity:0.9"></div></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
    }

    // ★ Winmart — small green square
    return L.divIcon({
      className: 'wh-marker-wm',
      html: `<div style="
        width:10px; height:10px; border-radius:2px;
        background:${color}; border:1.5px solid #fff;
        box-shadow: 0 0 6px ${color}80;
        transition: transform 0.2s ease;
      "></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });
  }

  function renderMap() {
    markerLayer.clearLayers();
    markers = [];
    const filtered = getFiltered();

    filtered.forEach(w => {
      const icon = createMarkerIcon(w.type, w.province);
      const color = PROVINCE_COLORS[w.province] || '#888';
      const typeLabel = GHN_STATS.types[w.type];
      const typeIcon = GHN_STATS.typeIcons[w.type];

      const popup = L.popup({ className: 'wh-popup', maxWidth: 300 }).setContent(`
        <div style="font-family:Inter,sans-serif;">
          <div style="font-weight:700;font-size:0.95rem;margin-bottom:6px;color:#333">
            ${typeIcon} ${w.name}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
            <span style="background:${GHN_STATS.typeColors[w.type]};color:#fff;padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:600">${typeLabel}</span>
            <span style="background:${color};color:#fff;padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:600">${w.province}</span>
          </div>
          <div style="font-size:0.8rem;color:#555;line-height:1.5">
            📍 ${w.district}<br>
            🌐 ${w.lat.toFixed(6)}, ${w.lng.toFixed(6)}<br>
            👤 OM: ${w.om}
          </div>
        </div>
      `);

      const marker = L.marker([w.lat, w.lng], { icon })
        .bindPopup(popup)
        .on('mouseover', function() {
          this._icon.querySelector('div').style.transform = 'scale(1.5)';
        })
        .on('mouseout', function() {
          this._icon.querySelector('div').style.transform = 'scale(1)';
        });

      markerLayer.addLayer(marker);
      markers.push({ marker, data: w });
    });

    // Update stats bar
    renderStatsBar(filtered);
    fitAll();
  }

  function renderStatsBar(filtered) {
    const bar = document.getElementById('wh-stats-bar');
    const byProv = {};
    filtered.forEach(w => {
      byProv[w.province] = (byProv[w.province] || 0) + 1;
    });
    bar.innerHTML = Object.entries(byProv)
      .sort((a, b) => b[1] - a[1])
      .map(([prov, count]) => {
        const color = PROVINCE_COLORS[prov] || '#888';
        return `<div class="wh-stat">
          <span class="wh-type-dot" style="background:${color}"></span>
          ${prov}: <strong>${count}</strong>
        </div>`;
      }).join('');
  }

  function renderTable(searchTerm = '') {
    const tbody = document.getElementById('wh-table-body');
    const filtered = getFiltered().filter(w => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return w.name.toLowerCase().includes(s) ||
             w.province.toLowerCase().includes(s) ||
             w.district.toLowerCase().includes(s);
    });

    document.getElementById('wh-count').textContent = filtered.length;

    tbody.innerHTML = filtered.map((w, i) => {
      const typeColor = GHN_STATS.typeColors[w.type];
      const provColor = PROVINCE_COLORS[w.province] || '#888';
      return `<tr onclick="WarehouseMap.flyTo(${w.lat},${w.lng})" style="cursor:pointer">
        <td>${i + 1}</td>
        <td style="font-weight:600">${GHN_STATS.typeIcons[w.type]} ${w.name}</td>
        <td><span style="background:${typeColor};color:#fff;padding:2px 10px;border-radius:10px;font-size:0.72rem;font-weight:600">${GHN_STATS.types[w.type]}</span></td>
        <td><span style="color:${provColor};font-weight:500">${w.province}</span></td>
        <td style="font-size:0.82rem">${w.district}</td>
        <td style="font-size:0.75rem;color:var(--text-muted)">${w.lat.toFixed(4)}, ${w.lng.toFixed(4)}</td>
        <td style="font-size:0.8rem">${w.om}</td>
      </tr>`;
    }).join('');
  }

  function flyTo(lat, lng) {
    map.flyTo([lat, lng], 14, { duration: 0.8 });
    // Open popup of the nearest marker
    markers.forEach(m => {
      if (m.data.lat === lat && m.data.lng === lng) {
        m.marker.openPopup();
      }
    });
  }

  function fitAll() {
    const filtered = getFiltered();
    if (filtered.length === 0) return;
    const bounds = L.latLngBounds(filtered.map(w => [w.lat, w.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }

  // ===== Filter Logic =====
  function toggleDropdown(type) {
    const id = type === 'province' ? 'province-dropdown' : 'type-dropdown';
    const dd = document.getElementById(id);
    const wasOpen = dd.classList.contains('show');
    closeAllDropdowns();
    if (!wasOpen) {
      dd.classList.add('show');
      openDropdown = id;
    }
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.wh-dropdown').forEach(d => d.classList.remove('show'));
    openDropdown = null;
  }

  function onProvChange() {
    const checks = document.querySelectorAll('#province-filter-list input[type=checkbox]');
    selectedProvinces.clear();
    checks.forEach(c => { if (c.checked) selectedProvinces.add(c.dataset.province); });
    document.getElementById('prov-all').checked = selectedProvinces.size === GHN_STATS.provinces.length;
    updateProvLabel();
    refresh();
  }

  function onProvSelectAll() {
    const allChecked = document.getElementById('prov-all').checked;
    document.querySelectorAll('#province-filter-list input[type=checkbox]').forEach(c => c.checked = allChecked);
    selectedProvinces.clear();
    if (allChecked) GHN_STATS.provinces.forEach(p => selectedProvinces.add(p));
    updateProvLabel();
    refresh();
  }

  function updateProvLabel() {
    const label = document.getElementById('province-filter-label');
    const total = GHN_STATS.provinces.length;
    if (selectedProvinces.size === total) {
      label.textContent = '🏛️ Tất cả tỉnh';
    } else if (selectedProvinces.size === 0) {
      label.textContent = '🏛️ Chưa chọn';
    } else if (selectedProvinces.size <= 2) {
      label.textContent = '🏛️ ' + [...selectedProvinces].join(', ');
    } else {
      label.textContent = `🏛️ ${selectedProvinces.size}/${total} tỉnh`;
    }
  }

  function onTypeChange() {
    const checks = document.querySelectorAll('#type-filter-list input[type=checkbox]');
    selectedTypes.clear();
    checks.forEach(c => { if (c.checked) selectedTypes.add(c.dataset.type); });
    document.getElementById('type-all').checked = selectedTypes.size === Object.keys(GHN_STATS.types).length;
    updateTypeLabel();
    refresh();
  }

  function onTypeSelectAll() {
    const allChecked = document.getElementById('type-all').checked;
    document.querySelectorAll('#type-filter-list input[type=checkbox]').forEach(c => c.checked = allChecked);
    selectedTypes.clear();
    if (allChecked) Object.keys(GHN_STATS.types).forEach(t => selectedTypes.add(t));
    updateTypeLabel();
    refresh();
  }

  function updateTypeLabel() {
    const label = document.getElementById('type-filter-label');
    const total = Object.keys(GHN_STATS.types).length;
    if (selectedTypes.size === total) {
      label.textContent = '📦 Tất cả loại kho';
    } else if (selectedTypes.size === 0) {
      label.textContent = '📦 Chưa chọn';
    } else {
      label.textContent = '📦 ' + [...selectedTypes].map(t => GHN_STATS.types[t]).join(', ');
    }
  }

  function refresh() {
    renderKPIs();
    renderMap();
    renderTable(document.getElementById('wh-search').value);
  }

  function onSearch() {
    renderTable(document.getElementById('wh-search').value);
  }

  function resetAll() {
    // Reset all filters
    document.querySelectorAll('.wh-dropdown input[type=checkbox]').forEach(c => c.checked = true);
    selectedProvinces.clear();
    GHN_STATS.provinces.forEach(p => selectedProvinces.add(p));
    selectedTypes.clear();
    Object.keys(GHN_STATS.types).forEach(t => selectedTypes.add(t));
    document.getElementById('wh-search').value = '';
    updateProvLabel();
    updateTypeLabel();
    refresh();
  }

  // Init on load
  document.addEventListener('DOMContentLoaded', init);

  return {
    toggleDropdown, onProvChange, onProvSelectAll, onTypeChange, onTypeSelectAll,
    onSearch, resetAll, fitAll, flyTo
  };
})();
