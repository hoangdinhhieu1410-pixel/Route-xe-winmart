Hãy tạo cho tôi context:  
Tôi là 1 nhà vận tải, tôi đang cần xây tuyến cho tối ưu lộ trình di chuyển là ngắn nhất và hợp lý nhất trong tỉnh Nam Định.  
Tôi đang có 1 bài toán sau, hiện tại tôi đang có 2 kho giao hàng với tọa độ như sau: 

Kho Thành phố Nam Định:  
[https://www.google.com/maps/place/Van+Anh+Ltd.,+Co/@20.4047421,106.1479805,209m/data=\!3m1\!1e3\!4m14\!1m7\!3m6\!1s0x3135df722a336d1d:0x398797b68ec44d62\!2zTjEga2h1IGPDtG5nIG5naGnhu4dwIGFuIHjDoQ\!8m2\!3d20.4053765\!4d106.1434886\!16s%2Fg%2F11t\_js\_wyx\!3m5\!1s0x3135de19c040f441:0x7a0f5c311e8a6ded\!8m2\!3d20.4045748\!4d106.147727\!16s%2Fg%2F12vs6sklx\!5m1\!1e1?entry=ttu\&g\_ep=EgoyMDI2MDUyMC4wIKXMDSoASAFQAw%3D%3D](https://www.google.com/maps/place/Van+Anh+Ltd.,+Co/@20.4047421,106.1479805,209m/data=!3m1!1e3!4m14!1m7!3m6!1s0x3135df722a336d1d:0x398797b68ec44d62!2zTjEga2h1IGPDtG5nIG5naGnhu4dwIGFuIHjDoQ!8m2!3d20.4053765!4d106.1434886!16s%2Fg%2F11t_js_wyx!3m5!1s0x3135de19c040f441:0x7a0f5c311e8a6ded!8m2!3d20.4045748!4d106.147727!16s%2Fg%2F12vs6sklx!5m1!1e1?entry=ttu&g_ep=EgoyMDI2MDUyMC4wIKXMDSoASAFQAw%3D%3D)

Kho Hải Hậu:   
[https://www.google.com/maps/place/20%C2%B006'23.4%22N+106%C2%B015'18.0%22E/@20.1579813,106.1072719,52553m/data=\!3m1\!1e3\!4m4\!3m3\!8m2\!3d20.1065\!4d106.255\!5m1\!1e1?entry=ttu\&g\_ep=EgoyMDI2MDUyMC4wIKXMDSoASAFQAw%3D%3D](https://www.google.com/maps/place/20%C2%B006'23.4%22N+106%C2%B015'18.0%22E/@20.1579813,106.1072719,52553m/data=!3m1!1e3!4m4!3m3!8m2!3d20.1065!4d106.255!5m1!1e1?entry=ttu&g_ep=EgoyMDI2MDUyMC4wIKXMDSoASAFQAw%3D%3D)

Danh sách các điểm cửa hàng winmart:   
[https://docs.google.com/spreadsheets/d/1BB31F-yvEis6hQKWvIv1kcGrto9Y7G\_xJbHTeiZR-LA/edit?gid=0\#gid=0](https://docs.google.com/spreadsheets/d/1BB31F-yvEis6hQKWvIv1kcGrto9Y7G_xJbHTeiZR-LA/edit?gid=0#gid=0)

Tôi đang sử dụng dòng xe có khối lượng chuyên chở là 1900 kg, 15 khối   
Bây giờ tôi muốn xe tải xuất phát từ 2 kho kia thì sẽ giao hàng đến tất cả các điểm Winmart có trong tỉnh Nam Định  
Trên link đã có rõ kinh độ \- vĩ độ của từng cửa hàng 

Logic sẽ như sau: 

1. Mỗi điểm winmart sẽ giao mất thời gian từ 30-45 phút   
2. Trung bình mỗi điểm winmart giao sẽ tầm 50 kg  
3. Xe tải sẽ có thời gian làm việc từ 7h sáng đến 19h tối. Hiểu là 7h sáng lên kho xuất hàng để đi giao và 19h phải về kho kết thúc ca  
4. Trên xe tải sẽ chứa 70% là hàng của cửa hàng winmart và 30% còn lại là hàng của các shop khác.   
   Đối với 30% hàng của các shop khác này sẽ giao mất trung bình tầm 3 tiếng/ngày 

Hãy xây cho tôi 1 dasboard lộ trình Route xe tối ưu nhất và chi tiết nhất  
Tính toán quãng đường di chuyển hết bao nhiêu km ?   
Tính toán thời gian vận tốc di chuyển   
Show ra bảng danh sách các cửa hàng winmart   
Lộ trình di chuyển chi tiết từng điểm 

Và 1 bảng tổng quan là từng xe sẽ chạy những khu vực quận huyện nào ?

