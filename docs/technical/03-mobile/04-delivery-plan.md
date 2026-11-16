# CNMA Approval Mobile — Kế hoạch triển khai

> Tài liệu cho BA, Functional và quản lý dự án: app làm được gì, làm theo thứ tự nào, test ra sao, cần chuẩn bị gì để chạy thật.
> Chi tiết kỹ thuật cho dev nằm ở [01-mobile-architecture-guide.md](./01-mobile-architecture-guide.md).

---

## 1. Hiện trạng

Bản hiện tại là **bản thử nghiệm (POC)**, dùng để chứng minh app chạy được và xem trước giao diện:

- Đăng nhập bằng tài khoản Microsoft công ty.
- Trang chủ: lời chào, số yêu cầu chờ duyệt, 5 yêu cầu mới nhất.
- Danh sách chờ duyệt và đã duyệt: tìm kiếm, lọc theo loại chứng từ và loại con (PR/PO).
- Xem chi tiết chứng từ: thông tin chung, dòng hàng, luồng duyệt, file đính kèm, bình luận.
- Trang cá nhân, đăng xuất.

**Chưa làm được:** duyệt / từ chối, chuyển tiếp, viết bình luận, mở file đính kèm, thông báo đẩy, Dashboard.
Lưu ý: ở bản POC, app gọi SAP bằng một **tài khoản kỹ thuật dùng chung**, chưa phải tài khoản SAP của từng người.

---

## 2. Ba môi trường

| Môi trường | Ai dùng | Đăng nhập bằng | Dữ liệu SAP |
|---|---|---|---|
| **DEV** | Đội phát triển | Tài khoản giống như đang dùng cho web | Hệ thống SAP DEV |
| **QAS** (test) | Dev, BA, Functional | Tài khoản giống như đang dùng cho web | Hệ thống SAP QAS |
| **PRD** (chạy thật) | Người dùng cuối | Tài khoản Microsoft công ty | Hệ thống SAP PRD |

- Ở cả ba môi trường, **mỗi người thấy đúng công việc của mình trên SAP** và các thao tác duyệt được ghi nhận dưới tên người đó, giống web.
- QAS dùng lại cách đăng nhập của web nên **không phải chờ quản trị Microsoft (Azure admin)**. Chỉ môi trường PRD mới cần nhờ Azure admin.
- Trên điện thoại sẽ có 2 app tách biệt, ví dụ "CNMA Approval QAS" và "CNMA Approval", cài song song được và không lẫn dữ liệu.

---

## 3. Giai đoạn phát triển

### Bước 1 — Làm nền móng
- Tách app thành 3 phiên bản DEV, QAS, PRD.
- Đăng nhập đúng tài khoản theo từng môi trường.
- **Gọi SAP bằng chính tài khoản của người dùng** thay cho tài khoản kỹ thuật. Đây là điều kiện để BA bắt đầu test trên QAS.
- Hỗ trợ tiếng Anh và tiếng Việt.
- Báo "Mất kết nối" khi không có mạng, và khoá nút Duyệt lúc đó.

### Bước 2 — Các chức năng chính

| Màn hình | Người dùng làm được gì |
|---|---|
| **Trang chủ** | Xem tổng quan: số chờ duyệt, đã xong, 5 yêu cầu mới nhất. Bấm để mở chi tiết |
| **Chờ duyệt (Inbox)** | Tìm, lọc (loại chứng từ, loại con, loại công việc, ngày tạo). **Chọn nhiều yêu cầu để duyệt một lần** |
| **Đã duyệt (Approved)** | Xem lại lịch sử đã duyệt, tìm và lọc |
| **Chi tiết chứng từ** | Xem đầy đủ thông tin như trên web. Mở PR tham chiếu từ một PO |
| **Duyệt / Từ chối** | Bấm Duyệt hoặc Từ chối, nhập ý kiến (bắt buộc khi SAP yêu cầu). Yêu cầu biến mất khỏi danh sách ngay; nếu lỗi thì hiện lại kèm thông báo |
| **Chuyển tiếp** | Tìm người nhận, kèm ghi chú |
| **Bình luận** | Viết bình luận, nhắc tên người khác (@tên) |
| **File đính kèm** | Mở xem PDF / hình ảnh ngay trong app, chia sẻ sang ứng dụng khác |
| **Dashboard** | Biểu đồ trạng thái, thống kê theo loại chứng từ, danh sách có bộ lọc |
| **Cá nhân** | Đổi ngôn ngữ, bật/tắt thông báo, xem phiên bản, đăng xuất |

### Bước 3 — Thông báo đẩy
- Có yêu cầu mới thì điện thoại nhận thông báo. Bấm vào là mở đúng chứng từ đó.
- Icon app hiện số yêu cầu đang chờ.
- Phía SAP cần làm thêm phần gửi thông báo (đội ABAP).

### Bước 4 — Hoàn thiện
- Chạy mượt trên máy cấu hình thấp, hỗ trợ chữ lớn và người khiếm thị.
- Ghi nhận lỗi tự động để đội dev xử lý (không ghi dữ liệu nghiệp vụ).

---

## 4. Giai đoạn kiểm thử

| Ai | Làm gì | Ở đâu |
|---|---|---|
| Dev | Test tự động các phần tính toán và các luồng chính (đăng nhập → mở chứng từ → duyệt) | DEV |
| Dev + BA | So sánh mobile với web: cùng một chứng từ phải hiển thị giống nhau | QAS |
| BA + Functional | **UAT** theo kịch bản cho từng loại: PR, PO (các loại con), Claim, Reservation, công việc CC | QAS |
| BA | Test trên nhiều loại máy: iPhone, iPad, Android điện thoại/máy tính bảng, máy gập, chế độ tối, chữ lớn | QAS |
| Dev | Kiểm tra bảo mật: đăng xuất xoá sạch dữ liệu, không lưu dữ liệu nghiệp vụ trên máy | QAS |

Cách cài bản test: đội dev gửi **link cài đặt**. iPhone cần đăng ký máy trước hoặc cài qua TestFlight; Android cài trực tiếp.

---

## 5. Chuẩn bị môi trường QAS

| Việc | Người làm |
|---|---|
| Tạo cấu hình đăng nhập cho app mobile (dùng chung hệ thống đăng nhập với web) | Đội BTP / Basis |
| Kiểm tra kết nối SAP theo tài khoản người dùng (đã có sẵn cho web, chỉ cần dùng lại) | Đội BTP / Basis |
| Tạo tài khoản test cho dev, BA, Functional, **email trùng với tài khoản SAP QAS** | Basis |
| Tạo link cài đặt bản QAS | Dev |

## 6. Chuẩn bị môi trường PRD

| Việc | Người làm |
|---|---|
| Đăng ký app trên Microsoft của công ty (**3 mục cấu hình**, đội dev gửi hướng dẫn chi tiết) | **Azure admin** |
| Kết nối Microsoft với hệ thống BTP production | Đội BTP |
| Kết nối tới SAP PRD theo tài khoản người dùng | Basis |
| Bảo quản mật khẩu ứng dụng phía server (không đưa vào app) | Dev / BTP |
| Tài khoản phát hành Apple và Google (hoặc hệ thống quản lý thiết bị của công ty) | IT / quản lý dự án |
| Cấu hình thông báo đẩy cho bản chính thức | Dev + ABAP |
| Theo dõi vận hành, quy trình xử lý sự cố | Dev / vận hành |

---

## 7. Thứ tự đề xuất

1. **Nền móng**: gọi SAP bằng tài khoản người dùng → BA bắt đầu test trên QAS.
2. **Duyệt / Từ chối, Chuyển tiếp, Bình luận**: chức năng cốt lõi.
3. **File đính kèm, PR tham chiếu.**
4. **Thông báo đẩy** (cần đội ABAP).
5. **Dashboard, duyệt hàng loạt.**
6. Hoàn thiện → UAT trên QAS → chuẩn bị PRD → phát hành.
