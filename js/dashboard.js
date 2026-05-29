// ============================================
// 📊 DASHBOARD - Render giao diện & tương tác
// ============================================

const Dashboard = {
  solution: null,
  activeVehicleId: null,
  currentProvince: 'nam_dinh',

  // ==============================
  // 🚀 Khởi chạy Dashboard
  // ==============================
  init() {
    document.getElementById('loading').classList.remove('hidden');

    const pConfig = CONFIG.provinces[this.currentProvince];
    MapController.init(pConfig.mapCenter, pConfig.mapZoom);
    MapController.addWarehouseMarkers(pConfig.warehouses);

    setTimeout(() => {
      this.solution = VRPSolver.solve(this.currentProvince);

      this.renderKPI(this.solution.summary);
      this.renderWarehouseSummary(this.solution);
      this.renderMapLegend(this.solution.vehicles);
      this.renderVehicleFilter(this.solution.vehicles);
      this.renderVehicleOverview(this.solution.vehicles);
      this.renderVehicleTable(this.solution.vehicles);
      this.renderVehicleSchedules(this.solution.vehicles);
      this.renderRouteCards(this.solution.vehicles);
      this.renderStoreList();

      // Update store count
      const allStores = pConfig.getStores();
      const storeCountEl = document.getElementById('store-count');
      if (storeCountEl) storeCountEl.textContent = allStores.length;

      MapController.drawRoutes(this.solution);
      MapController.fitAll(allStores, pConfig.warehouses);

      setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
      }, 500);
    }, 100);
  },

  // ==============================
  // 🗺️ Chuyển tỉnh
  // ==============================
  switchProvince(provinceKey) {
    if (this.currentProvince === provinceKey) return;
    this.currentProvince = provinceKey;

    // Update tab styling
    document.querySelectorAll('.province-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.province === provinceKey);
    });

    const pConfig = CONFIG.provinces[provinceKey];

    // Update subtitle
    const subtitle = document.getElementById('header-subtitle');
    if (subtitle) {
      subtitle.textContent = `Winmart ${pConfig.name} \u2022 T\u1ed1i \u01b0u l\u1ed9 tr\u00ecnh giao h\u00e0ng`;
    }

    // Show loading
    document.getElementById('loading').classList.remove('hidden');

    // Re-init map for new province
    MapController.init(pConfig.mapCenter, pConfig.mapZoom);
    MapController.addWarehouseMarkers(pConfig.warehouses);

    setTimeout(() => {
      this.solution = VRPSolver.solve(provinceKey);
      this.activeVehicleId = null;

      this.renderKPI(this.solution.summary);
      this.renderWarehouseSummary(this.solution);
      this.renderMapLegend(this.solution.vehicles);
      this.renderVehicleFilter(this.solution.vehicles);
      this.renderVehicleOverview(this.solution.vehicles);
      this.renderVehicleTable(this.solution.vehicles);
      this.renderVehicleSchedules(this.solution.vehicles);
      this.renderRouteCards(this.solution.vehicles);
      this.renderStoreList();

      // Update store count
      const allStores = pConfig.getStores();
      const storeCountEl = document.getElementById('store-count');
      if (storeCountEl) storeCountEl.textContent = allStores.length;

      // Reset district filter
      const select = document.getElementById('district-filter');
      if (select) {
        select.innerHTML = '<option value="">T\u1ea5t c\u1ea3 qu\u1eadn/huy\u1ec7n</option>';
      }
      // Repopulate district filter
      [...new Set(allStores.map(s => s.district))].sort().forEach(d => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d;
        select.appendChild(opt);
      });

      MapController.drawRoutes(this.solution);
      MapController.fitAll(allStores, pConfig.warehouses);

      setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
      }, 500);
    }, 100);
  },

  // ==============================
  // 📊 KPI Cards
  // ==============================
  renderKPI(summary) {
    const container = document.getElementById('kpi-grid');
    const avgTime = Math.round(this.solution.vehicles.reduce((s, v) => s + v.totalTime, 0) / this.solution.vehicles.length);
    const avgTimeH = Math.floor(avgTime / 60);
    const avgTimeM = avgTime % 60;

    container.innerHTML = `
      <div class="kpi-card blue fade-in fade-in-delay-1">
        <div class="kpi-icon">🚛</div>
        <div class="kpi-value">${summary.totalVehicles}</div>
        <div class="kpi-label">Tổng số xe cần</div>
      </div>
      <div class="kpi-card pink fade-in fade-in-delay-2">
        <div class="kpi-icon">📍</div>
        <div class="kpi-value">${summary.totalStores}</div>
        <div class="kpi-label">Điểm giao Winmart</div>
      </div>
      <div class="kpi-card teal fade-in fade-in-delay-3">
        <div class="kpi-icon">🛣️</div>
        <div class="kpi-value">${summary.totalDistance}</div>
        <div class="kpi-label">Tổng km di chuyển</div>
      </div>
      <div class="kpi-card orange fade-in fade-in-delay-4">
        <div class="kpi-icon">📦</div>
        <div class="kpi-value">${(summary.totalStores * 50).toLocaleString()}</div>
        <div class="kpi-label">Tổng kg (Winmart)</div>
      </div>
      <div class="kpi-card blue fade-in fade-in-delay-5">
        <div class="kpi-icon">⏱️</div>
        <div class="kpi-value">${avgTimeH}h${avgTimeM > 0 ? avgTimeM + 'p' : ''}</div>
        <div class="kpi-label">TB thời gian/xe</div>
      </div>
      <div class="kpi-card pink fade-in fade-in-delay-6">
        <div class="kpi-icon">🎯</div>
        <div class="kpi-value">${summary.avgStopsPerVehicle}</div>
        <div class="kpi-label">TB điểm/xe</div>
      </div>
    `;
  },

  // ==============================
  // 🏭 Warehouse Summary
  // ==============================
  renderWarehouseSummary(solution) {
    const container = document.getElementById('warehouse-summary');
    let html = '';
    const pConfig = CONFIG.provinces[this.currentProvince];
    pConfig.warehouses.forEach(w => {
      const data = solution.summary.warehouseBreakdown[w.id];
      if (!data) return;
      html += `
        <div class="warehouse-card fade-in">
          <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${w.color}"></div>
          <div class="warehouse-card-header">
            <div class="warehouse-icon" style="background:${w.color}">🏭</div>
            <div>
              <div class="warehouse-name">${w.name}</div>
              <div class="warehouse-coords">${w.lat.toFixed(4)}, ${w.lng.toFixed(4)}</div>
            </div>
          </div>
          <div class="warehouse-stats">
            <div class="warehouse-stat">
              <div class="warehouse-stat-value" style="color:${w.color}">${data.vehicles}</div>
              <div class="warehouse-stat-label">Xe</div>
            </div>
            <div class="warehouse-stat">
              <div class="warehouse-stat-value" style="color:${w.color}">${data.stores}</div>
              <div class="warehouse-stat-label">Điểm</div>
            </div>
            <div class="warehouse-stat">
              <div class="warehouse-stat-value" style="color:${w.color}">${data.distance}</div>
              <div class="warehouse-stat-label">km</div>
            </div>
          </div>
        </div>`;
    });
    container.innerHTML = html;
  },

  // ==============================
  // 📋 Bảng tổng quan phân bổ xe
  // ==============================
  renderVehicleTable(vehicles) {
    const tbody = document.getElementById('vehicle-table-body');
    let html = '';
    vehicles.forEach(v => {
      const wm = CONFIG.provinces[this.currentProvince].warehouses.find(w => w.id === v.warehouseId);
      const timeH = Math.floor(v.totalTime / 60);
      const timeM = v.totalTime % 60;
      html += `
        <tr class="vehicle-row" data-vehicle-id="${v.id}" onclick="Dashboard.toggleVehicleHighlight(${v.id})">
          <td><span class="vehicle-badge" style="background:${v.color}">🚛 Xe ${v.id}</span></td>
          <td><span style="color:${wm?.color || '#fff'}">${v.warehouseName}</span></td>
          <td><div class="district-tags">${v.districts.map(d => `<span class="district-tag">${d}</span>`).join('')}</div></td>
          <td><strong>${v.totalStops}</strong></td>
          <td><strong>${v.totalDistance}</strong> km</td>
          <td>${v.totalWeight} kg</td>
          <td>${v.startTime} → ${v.returnTime}</td>
          <td>${timeH}h${timeM > 0 ? timeM + 'p' : ''}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
  },

  // ==============================
  // 📅 BẢNG LỊCH TRÌNH CHI TIẾT TỪNG XE
  // (Bao gồm cả 3h giao shop khác)
  // ==============================
  renderVehicleSchedules(vehicles) {
    const container = document.getElementById('vehicle-schedules');
    let html = '';

    vehicles.forEach(v => {
      const wm = CONFIG.provinces[this.currentProvince].warehouses.find(w => w.id === v.warehouseId);

      // Tính khung giờ giao shop khác (3 tiếng)
      // Đặt khung này SAU khi giao Winmart xong
      const lastStop = v.stores[v.stores.length - 1];
      const lastDepartureMin = this._timeToMinutes(lastStop.departureTime);
      const otherShopStart = lastStop.departureTime;
      const otherShopEndMin = lastDepartureMin + 180; // +3 tiếng
      const otherShopEnd = this._minutesToTime(otherShopEndMin);

      // Giờ về kho sau khi giao shop khác
      const returnAfterOtherMin = otherShopEndMin + this._timeToMinutes(v.returnTime) - lastDepartureMin - (this._timeToMinutes(v.returnTime) - lastDepartureMin) + Math.round(v.returnDistance / CONFIG.speed.rural * 60);
      const finalReturnMin = otherShopEndMin + Math.round(v.returnDistance / CONFIG.speed.rural * 60);
      const finalReturn = this._minutesToTime(finalReturnMin);

      html += `
      <div class="schedule-card fade-in" id="schedule-${v.id}">
        <div class="schedule-header" style="border-left: 4px solid ${v.color}">
          <div class="schedule-header-left">
            <div class="schedule-vehicle-icon" style="background:${v.color}">${v.id}</div>
            <div>
              <h3>🚛 Xe ${v.id} — ${v.warehouseName}</h3>
              <p>${v.districts.join(', ')} • ${v.totalStops} điểm Winmart • ${v.totalDistance} km</p>
            </div>
          </div>
          <div class="schedule-summary-pills">
            <span class="pill" style="background:${v.color}20;color:${v.color};border:1px solid ${v.color}50">${v.totalWeight} kg</span>
            <span class="pill" style="background:rgba(79,209,197,0.15);color:#4fd1c5;border:1px solid rgba(79,209,197,0.3)">7:00 → ${finalReturn}</span>
          </div>
        </div>

        <div class="schedule-table-wrap">
          <table class="schedule-table">
            <thead>
              <tr>
                <th style="width:40px">TT</th>
                <th>Hoạt động</th>
                <th>Địa chỉ / Khu vực</th>
                <th style="width:70px">Đến</th>
                <th style="width:70px">Rời</th>
                <th style="width:70px">+km</th>
                <th style="width:75px">Tổng km</th>
                <th style="width:65px">Tốc độ</th>
              </tr>
            </thead>
            <tbody>
              <!-- Xuất phát -->
              <tr class="row-warehouse">
                <td>🏭</td>
                <td><strong>Xuất phát - ${wm?.name}</strong></td>
                <td class="text-muted">${wm?.lat.toFixed(4)}, ${wm?.lng.toFixed(4)}</td>
                <td>—</td>
                <td><strong>07:00</strong></td>
                <td>—</td>
                <td>0</td>
                <td>—</td>
              </tr>

              <!-- Các điểm Winmart -->
              ${v.stores.map((stop, idx) => `
              <tr class="row-store">
                <td><span class="stop-num" style="background:${v.color}">${idx + 1}</span></td>
                <td><strong>${stop.store.name}</strong></td>
                <td>${stop.store.address}, <em>${stop.store.district}</em></td>
                <td>${stop.arrivalTime}</td>
                <td>${stop.departureTime}</td>
                <td>+${stop.distanceFromPrev}</td>
                <td>${stop.cumulativeDistance}</td>
                <td>${stop.speed} km/h</td>
              </tr>
              `).join('')}

              <!-- Giao hàng shop khác (3 tiếng) -->
              <tr class="row-other-shop">
                <td>📦</td>
                <td><strong>Giao hàng shop khác</strong> <span class="other-shop-badge">30% tải trọng</span></td>
                <td class="text-muted">Các điểm shop khác trong khu vực</td>
                <td>${otherShopStart}</td>
                <td>${otherShopEnd}</td>
                <td colspan="2" style="text-align:center"><em>~3 tiếng</em></td>
                <td>—</td>
              </tr>

              <!-- Về kho -->
              <tr class="row-warehouse row-return">
                <td>🏠</td>
                <td><strong>Về ${wm?.name}</strong></td>
                <td class="text-muted">Kết thúc ca làm việc</td>
                <td><strong>${finalReturn}</strong></td>
                <td>—</td>
                <td>+${v.returnDistance}</td>
                <td>${v.totalDistance}</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Thanh timeline trực quan -->
        <div class="schedule-timeline-bar">
          ${this._renderTimelineBar(v, otherShopStart, otherShopEnd, finalReturn)}
        </div>
      </div>`;
    });

    container.innerHTML = html;
  },

  // ==============================
  // Thanh timeline trực quan cho mỗi xe
  // ==============================
  _renderTimelineBar(vehicle, otherStart, otherEnd, finalReturn) {
    const totalMin = 720; // 12h (7:00-19:00)
    const startMin = 0; // 7:00 = 0

    const wmStartMin = 0;
    const wmEndMin = this._timeToMinutes(otherStart) - 420;
    const otherStartMin = wmEndMin;
    const otherEndMin = this._timeToMinutes(otherEnd) - 420;
    const returnMin = this._timeToMinutes(finalReturn) - 420;

    const wmPct = Math.min((wmEndMin / totalMin) * 100, 100);
    const otherPct = Math.min(((otherEndMin - otherStartMin) / totalMin) * 100, 100);
    const returnPct = Math.min(((returnMin - otherEndMin) / totalMin) * 100, 100);
    const freePct = Math.max(100 - wmPct - otherPct - returnPct, 0);

    return `
      <div class="tl-bar">
        <div class="tl-segment tl-winmart" style="width:${wmPct}%" title="Giao Winmart: 07:00 → ${otherStart}">
          <span>🛒 Winmart (${vehicle.totalStops} điểm)</span>
        </div>
        <div class="tl-segment tl-other" style="width:${otherPct}%" title="Shop khác: ${otherStart} → ${otherEnd}">
          <span>📦 Shop khác (3h)</span>
        </div>
        <div class="tl-segment tl-return" style="width:${returnPct}%" title="Về kho: → ${finalReturn}">
          <span>🏠 Về</span>
        </div>
        ${freePct > 2 ? `<div class="tl-segment tl-free" style="width:${freePct}%"><span>⏸️</span></div>` : ''}
      </div>
      <div class="tl-labels">
        <span>07:00</span>
        <span>${otherStart}</span>
        <span>${otherEnd}</span>
        <span>${finalReturn}</span>
        <span style="margin-left:auto">19:00</span>
      </div>
    `;
  },

  _timeToMinutes(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  },

  _minutesToTime(min) {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  },

  // ==============================
  // 📍 Route Detail Cards (Expandable timeline)
  // ==============================
  renderRouteCards(vehicles) {
    const container = document.getElementById('route-details');
    let html = '';
    vehicles.forEach(v => {
      const wm = CONFIG.provinces[this.currentProvince].warehouses.find(w => w.id === v.warehouseId);
      html += `
        <div class="route-card fade-in" id="route-card-${v.id}">
          <div class="route-card-header" onclick="Dashboard.toggleRouteCard(${v.id})">
            <div class="route-card-header-left">
              <div class="route-vehicle-icon" style="background:${v.color}">${v.id}</div>
              <div class="route-vehicle-info">
                <h3>🚛 Xe ${v.id} - ${v.warehouseName}</h3>
                <p>${v.districts.join(' • ')}</p>
              </div>
            </div>
            <div class="route-card-stats">
              <div class="route-stat"><div class="route-stat-value">${v.totalStops}</div><div class="route-stat-label">Điểm</div></div>
              <div class="route-stat"><div class="route-stat-value">${v.totalDistance}</div><div class="route-stat-label">km</div></div>
              <div class="route-stat"><div class="route-stat-value">${v.totalWeight}</div><div class="route-stat-label">kg</div></div>
              <div class="route-stat"><div class="route-stat-value">${v.returnTime}</div><div class="route-stat-label">Về kho</div></div>
            </div>
            <div class="route-card-chevron">▼</div>
          </div>
          <div class="route-card-body">
            <div class="route-timeline">
              <div class="timeline-item">
                <div class="timeline-dot warehouse">🏭</div>
                <div class="timeline-content">
                  <h4>${wm?.name || 'Kho'}</h4>
                  <p>Xuất phát giao hàng</p>
                  <div class="timeline-meta"><span>⏰ ${v.startTime}</span></div>
                </div>
              </div>
              ${v.stores.map((stop, idx) => `
                <div class="timeline-item">
                  <div class="timeline-dot store" style="border-color:${v.color}">${idx + 1}</div>
                  <div class="timeline-content">
                    <h4>${stop.store.name}</h4>
                    <p>${stop.store.address}, ${stop.store.district}</p>
                    <div class="timeline-meta">
                      <span>⏰ ${stop.arrivalTime} → ${stop.departureTime}</span>
                      <span>📍 +${stop.distanceFromPrev}km (${stop.cumulativeDistance}km)</span>
                      <span>🚗 ${stop.speed}km/h</span>
                    </div>
                  </div>
                </div>
              `).join('')}
              <div class="timeline-item">
                <div class="timeline-dot warehouse">🏠</div>
                <div class="timeline-content">
                  <h4>Về ${wm?.name || 'Kho'}</h4>
                  <p>+${v.returnDistance}km về kho</p>
                  <div class="timeline-meta"><span>⏰ ${v.returnTime}</span><span>📍 ${v.totalDistance}km tổng</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    });
    container.innerHTML = html;
  },

  // ==============================
  // 📝 Danh sách cửa hàng
  // ==============================
  renderStoreList(filterDistrict = '', searchText = '') {
    const tbody = document.getElementById('store-table-body');
    const allStores = CONFIG.provinces[this.currentProvince].getStores();
    let filtered = allStores;
    if (filterDistrict) filtered = filtered.filter(s => s.district === filterDistrict);
    if (searchText) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(s => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || s.district.toLowerCase().includes(q));
    }

    let html = '';
    filtered.forEach(s => {
      let vehicleInfo = '—', vehicleColor = '#555';
      if (this.solution) {
        for (const v of this.solution.vehicles) {
          const found = v.stores.find(st => st.store.id === s.id);
          if (found) { vehicleInfo = `Xe ${v.id}`; vehicleColor = v.color; break; }
        }
      }
      html += `
        <tr>
          <td>${s.id}</td>
          <td><strong>${s.name}</strong></td>
          <td>${s.address}</td>
          <td><span class="district-tag">${s.district}</span></td>
          <td style="font-family:monospace;font-size:0.75rem">${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</td>
          <td><span class="vehicle-badge" style="background:${vehicleColor};font-size:0.72rem;padding:2px 8px">${vehicleInfo}</span></td>
        </tr>`;
    });
    tbody.innerHTML = html || '<tr><td colspan="6" style="text-align:center;padding:40px;color:#6b6b80">Không tìm thấy</td></tr>';

    const select = document.getElementById('district-filter');
    if (select && select.options.length <= 1) {
      [...new Set(allStores.map(s => s.district))].sort().forEach(d => {
        const opt = document.createElement('option');
        opt.value = d; opt.textContent = d; select.appendChild(opt);
      });
    }
  },

  // ==============================
  // 🎨 Map Legend (click để lọc xe)
  // ==============================
  renderMapLegend(vehicles) {
    const container = document.getElementById('map-legend');
    let html = `<div class="legend-item" onclick="Dashboard.showAllOnMap()" style="font-weight:600">
      <div class="legend-color" style="background:linear-gradient(135deg,#667eea,#f093fb);border-radius:50%"></div>
      <span>📍 Tất cả xe</span>
    </div>`;
    vehicles.forEach(v => {
      html += `<div class="legend-item" onclick="Dashboard.toggleVehicleHighlight(${v.id})" title="Click để xem riêng xe ${v.id}">
        <div class="legend-color" style="background:${v.color}"></div>
        <span>Xe ${v.id} (${v.totalStops} điểm, ${v.totalDistance}km)</span>
      </div>`;
    });
    container.innerHTML = html;
  },

  // ==============================
  // Tương tác
  // ==============================
  toggleRouteCard(vehicleId) {
    const card = document.getElementById(`route-card-${vehicleId}`);
    if (card) card.classList.toggle('expanded');
  },

  toggleVehicleHighlight(vehicleId) {
    // Toggle checkbox in filter panel
    const cb = document.getElementById(`vf-${vehicleId}`);
    if (cb) {
      cb.checked = !cb.checked;
      this.applyVehicleFilter();
    }
  },

  showAllOnMap() {
    this.activeVehicleId = null;
    const pConfig = CONFIG.provinces[this.currentProvince];
    MapController.showAllVehicles();
    MapController.fitAll(pConfig.getStores(), pConfig.warehouses);
    document.querySelectorAll('.vehicle-row').forEach(r => r.classList.remove('active-row'));
    document.querySelectorAll('.schedule-card').forEach(c => c.classList.remove('schedule-active'));
  },

  onSearchInput() {
    const text = document.getElementById('store-search')?.value || '';
    const district = document.getElementById('district-filter')?.value || '';
    this.renderStoreList(district, text);
  },

  resetView() {
    this.showAllOnMap();
    // Reset all checkboxes to checked
    const allCb = document.getElementById('vf-all');
    if (allCb) allCb.checked = true;
    document.querySelectorAll('#vehicle-filter-list input[type="checkbox"]').forEach(cb => cb.checked = true);
    const vehicles = this.solution?.vehicles;
    if (vehicles) this._updateFilterBtnText(vehicles.length, vehicles.length);
  },

  // ==============================
  // 🗺️ Bảng tổng quan xe - huyện - km - thời gian
  // ==============================
  renderVehicleOverview(vehicles) {
    const tbody = document.getElementById('vehicle-overview-body');
    if (!tbody) return;
    let html = '';
    vehicles.forEach(v => {
      const wm = CONFIG.provinces[this.currentProvince].warehouses.find(w => w.id === v.warehouseId);
      const wmTimeH = Math.floor(v.totalTime / 60);
      const wmTimeM = v.totalTime % 60;
      const wmTimeStr = `${wmTimeH}h${wmTimeM > 0 ? wmTimeM + 'p' : ''}`;

      // Tổng thời gian ca: Winmart time + 3h shop + về kho
      const lastStop = v.stores[v.stores.length - 1];
      const lastDepMin = this._timeToMinutes(lastStop.departureTime);
      const totalCaMin = lastDepMin + 180 + Math.round(v.returnDistance / 45 * 60) - 420; // trừ 7:00
      const totalCaH = Math.floor(totalCaMin / 60);
      const totalCaM = totalCaMin % 60;
      const totalCaStr = `${totalCaH}h${totalCaM > 0 ? totalCaM + 'p' : ''}`;

      const kmStatus = v.totalDistance <= 100
        ? '<span style="color:#68d391;font-weight:600">✅ ≤100km</span>'
        : '<span style="color:#fc8181;font-weight:600">⚠️ >' + '100km</span>';

      html += `
        <tr class="vehicle-row" data-vehicle-id="${v.id}" onclick="Dashboard.toggleVehicleHighlight(${v.id})" style="cursor:pointer">
          <td><span class="vehicle-badge" style="background:${v.color}">🚛 Xe ${v.id}</span></td>
          <td><span style="color:${wm?.color || '#fff'}">${v.warehouseName}</span></td>
          <td>
            <div class="district-tags">${v.districts.map(d => `<span class="district-tag">${d}</span>`).join('')}</div>
          </td>
          <td><strong>${v.totalStops}</strong></td>
          <td><strong>${v.totalDistance}</strong> km</td>
          <td>${wmTimeStr}</td>
          <td>3h</td>
          <td><strong>${totalCaStr}</strong></td>
          <td>${kmStatus}</td>
        </tr>`;
    });
    tbody.innerHTML = html;
  },

  // ==============================
  // 🚛 Bộ lọc xe checkbox (multi-select)
  // ==============================
  renderVehicleFilter(vehicles) {
    const list = document.getElementById('vehicle-filter-list');
    if (!list) return;
    list.innerHTML = '';
    vehicles.forEach(v => {
      const label = document.createElement('label');
      label.className = 'vf-item';
      label.innerHTML = `
        <input type="checkbox" id="vf-${v.id}" checked data-vid="${v.id}" onchange="Dashboard.applyVehicleFilter()">
        <span class="vf-color" style="background:${v.color}"></span>
        <span>🚛 Xe ${v.id} — ${v.totalStops} điểm, ${v.totalDistance}km</span>`;
      list.appendChild(label);
    });
    // Update button text
    this._updateFilterBtnText(vehicles.length, vehicles.length);
  },

  toggleFilterPanel() {
    const panel = document.getElementById('vehicle-filter-panel');
    if (panel) panel.classList.toggle('hidden');
    // Close on outside click
    if (!panel.classList.contains('hidden')) {
      setTimeout(() => {
        const closeHandler = (e) => {
          if (!document.getElementById('vehicle-filter-wrap')?.contains(e.target)) {
            panel.classList.add('hidden');
            document.removeEventListener('click', closeHandler);
          }
        };
        document.addEventListener('click', closeHandler);
      }, 10);
    }
  },

  onFilterSelectAll() {
    const allCb = document.getElementById('vf-all');
    if (!allCb) return;
    // Delay to let the checkbox state update first
    setTimeout(() => {
      const checked = allCb.checked;
      document.querySelectorAll('#vehicle-filter-list input[type="checkbox"]').forEach(cb => {
        cb.checked = checked;
      });
      this.applyVehicleFilter();
    }, 10);
  },

  applyVehicleFilter() {
    const checkboxes = document.querySelectorAll('#vehicle-filter-list input[type="checkbox"]');
    const total = checkboxes.length;
    const selected = [];
    checkboxes.forEach(cb => {
      if (cb.checked) selected.push(parseInt(cb.dataset.vid));
    });

    const allCb = document.getElementById('vf-all');
    if (allCb) allCb.checked = (selected.length === total);

    // Update button text
    this._updateFilterBtnText(selected.length, total);

    // Update map
    if (selected.length === total || selected.length === 0) {
      const pConfig = CONFIG.provinces[this.currentProvince];
      MapController.showAllVehicles();
      MapController.fitAll(pConfig.getStores(), pConfig.warehouses);
    } else {
      MapController.showSelectedVehicles(selected);
    }

    // Highlight rows in tables
    const selectedSet = new Set(selected);
    document.querySelectorAll('.vehicle-row').forEach(r => {
      const vid = parseInt(r.dataset.vehicleId);
      r.classList.toggle('active-row', selected.length < total && selectedSet.has(vid));
    });
  },

  _updateFilterBtnText(selected, total) {
    const btn = document.getElementById('filter-toggle-btn');
    if (!btn) return;
    if (selected === total) {
      btn.textContent = '📍 Tất cả xe ▾';
    } else if (selected === 0) {
      btn.textContent = '📍 Chưa chọn xe ▾';
    } else {
      btn.textContent = `📍 ${selected}/${total} xe ▾`;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => { Dashboard.init(); });
