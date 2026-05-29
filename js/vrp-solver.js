// ============================================
// 🧮 VRP SOLVER v4 - Multi-Province
// Nam Định + Hà Nam
// ============================================

const VRPSolver = {

  // Khoảng cách Haversine (km)
  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  roadDistance(lat1, lon1, lat2, lon2) {
    return this.haversineDistance(lat1, lon1, lat2, lon2) * 1.35;
  },

  estimateSpeed(fromDistrict, toDistrict, urbanDistricts) {
    const urbanList = urbanDistricts || ['TP. Nam Định'];
    const isUrban = (d) => urbanList.includes(d);
    if (isUrban(fromDistrict) && isUrban(toDistrict)) return CONFIG.speed.urban;
    if (isUrban(fromDistrict) || isUrban(toDistrict)) return CONFIG.speed.suburban;
    if (fromDistrict === toDistrict) return CONFIG.speed.suburban;
    return CONFIG.speed.rural;
  },

  travelTimeMinutes(distanceKm, speedKmh) {
    return (distanceKm / speedKmh) * 60;
  },

  // ==============================
  // 🏭 Phân bổ kho (tổng quát)
  // ==============================
  assignStoresToWarehouses(stores, provinceConfig) {
    const assignments = {};
    provinceConfig.warehouses.forEach(w => { assignments[w.id] = []; });

    stores.forEach(store => {
      let assignedTo = null;

      // Tìm kho theo district mapping
      for (const [whId, districts] of Object.entries(provinceConfig.warehouseAssignment)) {
        if (districts.includes(store.district)) {
          assignedTo = whId;
          break;
        }
      }

      // Xử lý đặc biệt: Nghĩa Hưng chia đôi (chỉ cho Nam Định)
      if (!assignedTo && store.district === 'H. Nghĩa Hưng' && provinceConfig.nghiaHungSplit) {
        if (provinceConfig.nghiaHungSplit.north.includes(store.id)) {
          assignedTo = 'kho_tp_nam_dinh';
        } else {
          assignedTo = 'kho_hai_hau';
        }
      }

      // Fallback: kho gần nhất
      if (!assignedTo) {
        let minDist = Infinity;
        provinceConfig.warehouses.forEach(w => {
          const d = this.haversineDistance(store.lat, store.lng, w.lat, w.lng);
          if (d < minDist) { minDist = d; assignedTo = w.id; }
        });
      }

      store.assignedWarehouse = assignedTo;
      const wh = provinceConfig.warehouses.find(w => w.id === assignedTo);
      store.distanceToWarehouse = this.haversineDistance(store.lat, store.lng, wh.lat, wh.lng);
      assignments[assignedTo].push(store);
    });

    return assignments;
  },

  // ==============================
  // 📦 Chia chuyến (giới hạn 100km)
  // ==============================
  buildTrips(stores, warehouse) {
    const trips = [];
    const MAX_KM = 100;
    const sorted = [...stores].sort((a, b) =>
      this.haversineDistance(a.lat, a.lng, warehouse.lat, warehouse.lng) -
      this.haversineDistance(b.lat, b.lng, warehouse.lat, warehouse.lng)
    );

    let currentTrip = [], currentWeight = 0, currentTime = 0, estimatedTripKm = 0;

    sorted.forEach(store => {
      let travelDist;
      if (currentTrip.length === 0) {
        travelDist = this.roadDistance(warehouse.lat, warehouse.lng, store.lat, store.lng);
      } else {
        const last = currentTrip[currentTrip.length - 1];
        travelDist = this.roadDistance(last.lat, last.lng, store.lat, store.lng);
      }
      const speed = this.estimateSpeed(
        currentTrip.length === 0 ? warehouse.name : currentTrip[currentTrip.length - 1].district,
        store.district
      );
      const travelTime = this.travelTimeMinutes(travelDist, speed);
      const returnDist = this.roadDistance(store.lat, store.lng, warehouse.lat, warehouse.lng);
      const returnTime = this.travelTimeMinutes(returnDist, CONFIG.speed.rural);
      const totalTimeIfAdd = currentTime + travelTime + CONFIG.delivery.avgTimePerStop + returnTime;
      const totalWeightIfAdd = currentWeight + store.demand;
      const totalKmIfAdd = estimatedTripKm + travelDist + returnDist;

      if (totalTimeIfAdd > CONFIG.workday.winmartMinutes ||
          totalWeightIfAdd > CONFIG.vehicle.maxWinmartWeight ||
          totalKmIfAdd > MAX_KM) {
        if (currentTrip.length > 0) trips.push([...currentTrip]);
        currentTrip = [store];
        currentWeight = store.demand;
        const newDist = this.roadDistance(warehouse.lat, warehouse.lng, store.lat, store.lng);
        currentTime = this.travelTimeMinutes(newDist, CONFIG.speed.suburban) + CONFIG.delivery.avgTimePerStop;
        estimatedTripKm = newDist;
      } else {
        currentTrip.push(store);
        currentWeight = totalWeightIfAdd;
        currentTime += travelTime + CONFIG.delivery.avgTimePerStop;
        estimatedTripKm += travelDist;
      }
    });
    if (currentTrip.length > 0) trips.push(currentTrip);
    return trips;
  },

  // Chia cố định N xe (phân cụm theo góc địa lý)
  buildFixedTrips(stores, warehouse, numVehicles) {
    const withAngle = stores.map(s => ({
      ...s,
      angle: Math.atan2(s.lng - warehouse.lng, s.lat - warehouse.lat)
    }));
    withAngle.sort((a, b) => a.angle - b.angle);
    const trips = [];
    const perVehicle = Math.ceil(withAngle.length / numVehicles);
    for (let i = 0; i < numVehicles; i++) {
      const chunk = withAngle.slice(i * perVehicle, Math.min((i + 1) * perVehicle, withAngle.length));
      if (chunk.length > 0) trips.push(chunk);
    }
    return trips;
  },

  nearestNeighborRoute(stores, warehouse) {
    const route = [];
    const unvisited = [...stores];
    let current = { lat: warehouse.lat, lng: warehouse.lng, district: warehouse.name };
    while (unvisited.length > 0) {
      let minDist = Infinity, nearestIdx = 0;
      for (let i = 0; i < unvisited.length; i++) {
        const d = this.roadDistance(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng);
        if (d < minDist) { minDist = d; nearestIdx = i; }
      }
      current = unvisited[nearestIdx];
      route.push(unvisited.splice(nearestIdx, 1)[0]);
    }
    return route;
  },

  twoOptImprove(route, warehouse) {
    let improved = true, bestRoute = [...route];
    const totalDist = (r) => {
      let d = this.roadDistance(warehouse.lat, warehouse.lng, r[0].lat, r[0].lng);
      for (let i = 0; i < r.length - 1; i++)
        d += this.roadDistance(r[i].lat, r[i].lng, r[i + 1].lat, r[i + 1].lng);
      d += this.roadDistance(r[r.length - 1].lat, r[r.length - 1].lng, warehouse.lat, warehouse.lng);
      return d;
    };
    let bestDist = totalDist(bestRoute), iterations = 0;
    while (improved && iterations < 100) {
      improved = false; iterations++;
      for (let i = 0; i < bestRoute.length - 1; i++) {
        for (let j = i + 1; j < bestRoute.length; j++) {
          const newRoute = [...bestRoute];
          newRoute.splice(i + 1, j - i, ...newRoute.slice(i + 1, j + 1).reverse());
          const newDist = totalDist(newRoute);
          if (newDist < bestDist - 0.01) {
            bestRoute = newRoute; bestDist = newDist; improved = true;
          }
        }
      }
    }
    return bestRoute;
  },

  calculateRouteDetails(route, warehouse, vehicleId, color, urbanDistricts) {
    const details = [];
    let cumulativeDistance = 0, currentTime = CONFIG.workday.startHour * 60;
    let totalWeight = 0;
    const districts = new Set();
    const urbanList = urbanDistricts || ['TP. Nam Định'];

    for (let i = 0; i < route.length; i++) {
      const store = route[i];
      let distFromPrev, speed;
      if (i === 0) {
        distFromPrev = this.roadDistance(warehouse.lat, warehouse.lng, store.lat, store.lng);
        speed = this.estimateSpeed(urbanList[0], store.district, urbanList);
      } else {
        distFromPrev = this.roadDistance(route[i - 1].lat, route[i - 1].lng, store.lat, store.lng);
        speed = this.estimateSpeed(route[i - 1].district, store.district, urbanList);
      }
      const travelTime = this.travelTimeMinutes(distFromPrev, speed);
      cumulativeDistance += distFromPrev;
      currentTime += travelTime;
      totalWeight += store.demand;
      districts.add(store.district);

      const arrH = Math.floor(currentTime / 60), arrM = Math.round(currentTime % 60);
      const depTime = currentTime + CONFIG.delivery.avgTimePerStop;
      const depH = Math.floor(depTime / 60), depM = Math.round(depTime % 60);

      details.push({
        store, distanceFromPrev: Math.round(distFromPrev * 10) / 10,
        cumulativeDistance: Math.round(cumulativeDistance * 10) / 10,
        travelTimeMin: Math.round(travelTime * 10) / 10,
        arrivalTime: `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`,
        departureTime: `${String(depH).padStart(2, '0')}:${String(depM).padStart(2, '0')}`,
        speed
      });
      currentTime = depTime;
    }

    const lastStore = route[route.length - 1];
    const returnDist = this.roadDistance(lastStore.lat, lastStore.lng, warehouse.lat, warehouse.lng);
    const returnSpeed = this.estimateSpeed(lastStore.district, urbanList[0], urbanList);
    const returnTravelTime = this.travelTimeMinutes(returnDist, returnSpeed);
    const returnTime = currentTime + returnTravelTime;
    const retH = Math.floor(returnTime / 60), retM = Math.round(returnTime % 60);

    return {
      id: vehicleId, warehouseId: warehouse.id, warehouseName: warehouse.name,
      warehouseColor: warehouse.color, color,
      stores: details,
      totalDistance: Math.round((cumulativeDistance + returnDist) * 10) / 10,
      routeDistance: Math.round(cumulativeDistance * 10) / 10,
      returnDistance: Math.round(returnDist * 10) / 10,
      totalTime: Math.round(currentTime - CONFIG.workday.startHour * 60 + returnTravelTime),
      totalWeight, totalStops: route.length,
      districts: [...districts],
      returnTime: `${String(retH).padStart(2, '0')}:${String(retM).padStart(2, '0')}`,
      startTime: `${String(CONFIG.workday.startHour).padStart(2, '0')}:00`
    };
  },

  // ==============================
  // 🚛 GIẢI BÀI TOÁN CHÍNH (multi-province)
  // ==============================
  solve(provinceKey) {
    const pKey = provinceKey || 'nam_dinh';
    const pConfig = CONFIG.provinces[pKey];
    const stores = pConfig.getStores();
    const urbanDistricts = pConfig.urbanDistricts;

    console.time(`⏱️ VRP Solver - ${pConfig.name}`);
    console.log(`🚛 Tối ưu lộ trình: ${pConfig.name} (${stores.length} cửa hàng)...`);

    const assignments = this.assignStoresToWarehouses(stores, pConfig);

    const vehicles = [];
    let vehicleId = 1, colorIdx = 0, totalDistance = 0;

    pConfig.warehouses.forEach(warehouse => {
      const warehouseStores = assignments[warehouse.id];
      if (warehouseStores.length === 0) return;

      let trips;
      const fixedCount = pConfig.fixedVehicles?.[warehouse.id];
      if (fixedCount) {
        trips = this.buildFixedTrips(warehouseStores, warehouse, fixedCount);
        console.log(`🏭 ${warehouse.name}: ${fixedCount} xe (cố định), ${warehouseStores.length} cửa hàng`);
      } else {
        trips = this.buildTrips(warehouseStores, warehouse);
        console.log(`🏭 ${warehouse.name}: ${trips.length} chuyến, ${warehouseStores.length} cửa hàng`);
      }

      trips.forEach(trip => {
        let route = this.nearestNeighborRoute(trip, warehouse);
        route = this.twoOptImprove(route, warehouse);
        const color = CONFIG.routeColors[colorIdx % CONFIG.routeColors.length];
        const details = this.calculateRouteDetails(route, warehouse, vehicleId, color, urbanDistricts);
        vehicles.push(details);
        totalDistance += details.totalDistance;
        vehicleId++; colorIdx++;
      });
    });

    const summary = {
      totalVehicles: vehicles.length,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalStores: stores.length,
      avgDistancePerVehicle: Math.round(totalDistance / vehicles.length * 10) / 10,
      avgStopsPerVehicle: Math.round(stores.length / vehicles.length * 10) / 10,
      provinceName: pConfig.name,
      warehouseBreakdown: {}
    };

    pConfig.warehouses.forEach(w => {
      const wv = vehicles.filter(v => v.warehouseId === w.id);
      summary.warehouseBreakdown[w.id] = {
        name: w.name, color: w.color, vehicles: wv.length,
        stores: wv.reduce((s, v) => s + v.totalStops, 0),
        distance: Math.round(wv.reduce((s, v) => s + v.totalDistance, 0) * 10) / 10
      };
    });

    console.log(`✅ ${pConfig.name}: ${summary.totalVehicles} xe, ${summary.totalDistance} km`);
    console.timeEnd(`⏱️ VRP Solver - ${pConfig.name}`);
    return { vehicles, summary, provinceKey: pKey, provinceConfig: pConfig };
  }
};
