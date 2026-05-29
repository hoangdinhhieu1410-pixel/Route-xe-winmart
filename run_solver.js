// Script chạy VRP solver offline qua Node.js
// Để xem kết quả ngay lập tức

// Load config
eval(require('fs').readFileSync('d:/Antigravity/Route xe winmart/data/config.js', 'utf8'));
eval(require('fs').readFileSync('d:/Antigravity/Route xe winmart/data/stores.js', 'utf8'));
eval(require('fs').readFileSync('d:/Antigravity/Route xe winmart/js/vrp-solver.js', 'utf8'));

const result = VRPSolver.solve();

console.log('');
console.log('='.repeat(80));
console.log('  🚛 KẾT QUẢ TỐI ƯU LỘ TRÌNH GIAO HÀNG WINMART NAM ĐỊNH');
console.log('='.repeat(80));
console.log('');
console.log(`📊 TỔNG QUAN:`);
console.log(`  • Tổng số xe cần:         ${result.summary.totalVehicles} xe`);
console.log(`  • Tổng điểm giao Winmart: ${result.summary.totalStores} cửa hàng`);
console.log(`  • Tổng km di chuyển:      ${result.summary.totalDistance} km`);
console.log(`  • TB km/xe:               ${result.summary.avgDistancePerVehicle} km`);
console.log(`  • TB điểm/xe:             ${result.summary.avgStopsPerVehicle} điểm`);
console.log('');

// Phân bổ theo kho
console.log('🏭 PHÂN BỔ THEO KHO:');
Object.keys(result.summary.warehouseBreakdown).forEach(key => {
  const wb = result.summary.warehouseBreakdown[key];
  console.log(`  📍 ${wb.name}: ${wb.vehicles} xe, ${wb.stores} điểm, ${wb.distance} km`);
});
console.log('');

// Chi tiết từng xe
console.log('='.repeat(80));
console.log('  📅 LỊCH TRÌNH CHI TIẾT TỪNG XE');
console.log('='.repeat(80));

result.vehicles.forEach(v => {
  console.log('');
  console.log(`${'─'.repeat(70)}`);
  console.log(`🚛 XE ${v.id} | ${v.warehouseName} | ${v.totalStops} điểm | ${v.totalDistance} km | ${v.totalWeight} kg`);
  console.log(`   Khung giờ: ${v.startTime} → ${v.returnTime} | Huyện: ${v.districts.join(', ')}`);
  console.log(`${'─'.repeat(70)}`);
  console.log(`  ${'TT'.padEnd(4)}${'Tên cửa hàng'.padEnd(45)}${'Đến'.padEnd(8)}${'Rời'.padEnd(8)}${'+km'.padEnd(8)}${'Tổng'.padEnd(8)}${'Tốc độ'}`);
  console.log(`  ${'─'.repeat(64)}`);
  
  // Xuất phát
  console.log(`  ${'🏭'.padEnd(4)}${'Xuất phát kho'.padEnd(45)}${''.padEnd(8)}${'07:00'.padEnd(8)}${''.padEnd(8)}${'0'.padEnd(8)}${'—'}`);
  
  v.stores.forEach((stop, idx) => {
    const num = String(idx + 1).padEnd(4);
    const name = stop.store.name.substring(0, 42).padEnd(45);
    console.log(`  ${num}${name}${stop.arrivalTime.padEnd(8)}${stop.departureTime.padEnd(8)}${('+'+stop.distanceFromPrev).padEnd(8)}${String(stop.cumulativeDistance).padEnd(8)}${stop.speed}km/h`);
  });
  
  // 3h shop khác
  const lastStop = v.stores[v.stores.length - 1];
  const lastDepMin = parseInt(lastStop.departureTime.split(':')[0]) * 60 + parseInt(lastStop.departureTime.split(':')[1]);
  const otherEnd = lastDepMin + 180;
  const otherEndH = String(Math.floor(otherEnd / 60)).padStart(2, '0');
  const otherEndM = String(otherEnd % 60).padStart(2, '0');
  
  console.log(`  ${'📦'.padEnd(4)}${'GIAO HÀNG SHOP KHÁC (30% tải, 3 tiếng)'.padEnd(45)}${lastStop.departureTime.padEnd(8)}${(otherEndH+':'+otherEndM).padEnd(8)}${'~3h'.padEnd(8)}${''.padEnd(8)}${'—'}`);
  
  // Về kho  
  const returnMin = otherEnd + Math.round(v.returnDistance / 45 * 60);
  const retH = String(Math.floor(returnMin / 60)).padStart(2, '0');
  const retM = String(returnMin % 60).padStart(2, '0');
  console.log(`  ${'🏠'.padEnd(4)}${'Về kho'.padEnd(45)}${(retH+':'+retM).padEnd(8)}${''.padEnd(8)}${('+'+v.returnDistance).padEnd(8)}${String(v.totalDistance).padEnd(8)}${'—'}`);
});

console.log('');
console.log('='.repeat(80));
console.log('  ✅ HOÀN THÀNH');
console.log('='.repeat(80));
