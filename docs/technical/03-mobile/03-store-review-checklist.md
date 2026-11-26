# CNMA Approval Mobile — Store Review Checklist (Apple App Store & Google Play)

> **Owner:** Project Team | **Last Updated:** 2026-10-29 | **Status:** Draft — dùng trước mỗi lần nộp bản production
>
> Đi kèm [01-mobile-architecture-guide.md](./01-mobile-architecture-guide.md) (mục 15: phân phối) và [02-approval-core-refactor.md](./02-approval-core-refactor.md).
>
> ⚠️ Guideline của Apple và Google thay đổi theo thời gian. Trước mỗi lần nộp, đối chiếu lại [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) và [Google Play Policy Center](https://play.google.com/about/developer-content-policy/). Số hiệu guideline trong file này là để tham chiếu nhanh.

---

## 1. Bức tranh rủi ro

App này là **app nội bộ doanh nghiệp**, đăng nhập SSO Entra, dữ liệu thật trên SAP PRD. Các rủi ro bị reject **không nằm ở code renderer** mà ở:

| Mức | Rủi ro | Mục |
|---|---|---|
| 🔴 | Reviewer **không đăng nhập được** (MFA, Conditional Access, thiết bị không được quản lý) — lý do reject phổ biến nhất với app doanh nghiệp | §3 |
| 🔴 | Reviewer **bấm Approve thật** trên chứng từ PRD | §3.3 |
| 🔴 | Nộp **App Store công khai** cho một app chỉ nhân viên một công ty dùng được | §2 |
| 🟠 | Bản production còn **tính năng test** (dev-settings, nhãn DEV/QAS, endpoint test) | §5 |
| 🟠 | **iPad** chưa hoàn chỉnh trong khi bật `supportsTablet` | §6 |
| 🟠 | Thiếu **privacy policy**, khai báo App Privacy sai, xin quyền push không đúng lúc | §4 |
| 🟡 | Crash hoặc lỗi trên **mạng IPv6**, export compliance | §6, §5 |

**Về renderer khai báo (`approval-core`):** cấu hình view được **đóng gói sẵn trong app**, không tải về từ server, nên không vi phạm quy định cấm tải code làm thay đổi tính năng (Apple 2.5.2). Cập nhật OTA bằng EAS Update để **sửa lỗi JS/asset** là được phép, nhưng **không** dùng OTA để thêm tính năng lớn hay đổi mục đích app. **Không** làm server-driven UI kiểu thêm màn hình hay tính năng từ xa.

---

## 2. Chọn kênh phân phối

### 2.1 iOS

| Kênh | Phù hợp khi | Review | Ghi chú |
|---|---|---|---|
| **TestFlight** | Pilot, UAT với key user | Beta App Review (nhẹ hơn) cho tester ngoài. Tester nội bộ (thuộc team App Store Connect) không cần review | Mỗi build hết hạn sau 90 ngày. **Không** dùng làm kênh production lâu dài |
| **Custom App qua Apple Business Manager** (đề xuất) | Công ty có hoặc đăng ký được Apple Business Manager (cần D-U-N-S) | Có App Review | App chỉ hiện với tổ chức được chỉ định. Kết hợp được MDM để cài tự động |
| **Unlisted App Store** | Không có ABM, cần phát qua link | Có App Review + **phải gửi form xin Unlisted** | App không xuất hiện khi tìm kiếm, chỉ cài qua link |
| App Store công khai | — | Có App Review | **Không nên.** App chỉ dùng được với tài khoản một công ty dễ bị yêu cầu chuyển sang Custom/Unlisted |
| Apple Developer Enterprise Program | — | — | Apple gần như không cấp mới. Bỏ qua |

**Quyết định cần chốt:** công ty đã có Apple Business Manager chưa? Có thì chọn **Custom App**. Chưa có thì chọn **Unlisted**, và gửi form Unlisted sớm.

### 2.2 Android

| Kênh | Review | Ghi chú |
|---|---|---|
| **APK nội bộ qua EAS internal / MDM** (đang dùng cho pilot) | Không qua Google review | Người dùng phải cho phép cài từ nguồn ngoài, trừ khi có MDM |
| **Managed Google Play – Private app** (đề xuất cho production nếu có EMM/Intune) | Review nhẹ | Chỉ tổ chức được chỉ định thấy app, cập nhật tự động |
| Google Play công khai | Review đầy đủ + yêu cầu **closed testing** với tài khoản developer cá nhân mới | Không cần thiết cho app nội bộ |

---

## 3. Tài khoản demo cho reviewer (🔴 quan trọng nhất)

### 3.1 Yêu cầu
- Reviewer phải **đăng nhập và dùng được toàn bộ tính năng chính** mà không cần VPN, MDM hay thiết bị công ty.
- Tài khoản phải **luôn hoạt động** trong suốt thời gian review (có thể kéo dài vài ngày), và cả cho các lần nộp sau.

### 3.2 Cấu hình trên Entra (làm cùng Microsoft admin)
- [ ] Tạo user riêng, ví dụ `appreview@<company-domain>`, mật khẩu mạnh, **không hết hạn** trong giai đoạn review.
- [ ] Đưa user vào một **exclusion group** để không bị Conditional Access (compliant device, vị trí, sign-in frequency) và **MFA** chặn. Chỉ áp dụng cho đúng user này, có ghi nhận và phê duyệt của IT Security.
- [ ] Gán user vào Enterprise App SAML của XSUAA và app registration của mobile.
- [ ] Email của user phải map tới một user S/4 PRD qua CERTRULE.
- [ ] Theo dõi sign-in log của user này. Đổi mật khẩu sau mỗi lần review xong.

### 3.3 Dữ liệu reviewer nhìn thấy và thao tác (cần business quyết định)

| Phương án | Mô tả | Ưu | Nhược |
|---|---|---|---|
| **A. Chứng từ test trên PRD** | User S/4 của reviewer chỉ nhận task trên chứng từ test (company code hoặc cost center test, giá trị nhỏ), được tạo bổ sung định kỳ | Reviewer thấy luồng thật 100% | Decision thật được ghi vào SAP PRD. Cần quy trình tạo và dọn chứng từ test |
| **B. Review mode phía server** | BFF nhận diện **đúng user reviewer** rồi trả dữ liệu mẫu, decision chỉ ghi log và không gọi SAP | Không đụng dữ liệu PRD | Thêm code ở BFF. Phải đảm bảo không user nào khác kích hoạt được |

- **Không** làm "mock trong app" bật theo email đăng nhập. Code mock nằm trong bundle production là mùi xấu, và dễ bị coi là tính năng ẩn.
- Dù chọn phương án nào: lúc nộp phải có **ít nhất 3–5 task** cho mỗi loại chính (PR, PO, Claim, Reservation) kèm attachment mẫu, và vài task trong Approved.

### 3.4 Review Notes (mẫu, tiếng Anh)

```text
CNMA Approval is an internal approval app for <Company> employees. It lets managers review and
approve purchase requisitions, purchase orders, claims and reservations from SAP.

Sign-in: tap "Sign in with Microsoft", then use
  Username: appreview@<company-domain>
  Password: <provided in the App Review Information field>
MFA is disabled for this review account.

What to try:
1. Home shows pending counts and the newest tasks.
2. Open any task in Inbox to view header, line items, approval workflow, attachments and comments.
3. Tap Approve or Reject, add a comment and confirm. The task disappears from Inbox.
4. Dashboard shows status and category statistics with filters.

Accounts are provided by the company's Microsoft Entra ID. The app does not create accounts, so
in-app account deletion does not apply. Push notifications are used only to notify about new tasks.
A demo video is attached.
```

- [ ] Đính kèm **video demo** ngắn (1–2 phút) quay trên bản production.
- [ ] Điền đúng thông tin liên hệ (người phản hồi được trong giờ làm việc của Apple).

---

## 4. Privacy & quyền

### 4.1 Metadata bắt buộc
- [ ] **Privacy Policy URL** (bắt buộc kể cả với app nội bộ). Nêu dữ liệu thu thập, mục đích, nơi lưu, thời gian lưu, liên hệ.
- [ ] **Support URL**.

### 4.2 App Privacy (Apple) / Data safety (Google)

| Dữ liệu | Thu thập? | Mục đích | Liên kết với danh tính |
|---|---|---|---|
| Tên, email (từ Entra) | Có | Chức năng app (đăng nhập, hiển thị) | Có |
| User ID | Có | Chức năng app | Có |
| Device token push | Có (định danh thiết bị) | Gửi thông báo task mới | Có |
| Nội dung chứng từ SAP | Hiển thị, **không lưu trên máy** | Chức năng app | Có |
| Crash / diagnostics (EAS Observe, Sentry nếu dùng) | Có | Hiệu năng, sửa lỗi | Tuỳ cấu hình. Mặc định không gắn danh tính |
| Tracking / quảng cáo | **Không** | — | — |

- Không tracking, nên **không** cần App Tracking Transparency.
- Google Play: điền **Data safety** tương ứng, khai báo dữ liệu được mã hoá khi truyền (HTTPS).

### 4.3 Privacy manifest (iOS)
- [ ] Khai báo `ios.privacyManifests` trong `app.config.ts` cho các "required reason API" mà app và thư viện dùng (ví dụ `NSPrivacyAccessedAPICategoryUserDefaults`). Kiểm tra cảnh báo của App Store Connect sau khi upload build.
- [ ] Mỗi lần thêm thư viện native, kiểm tra thư viện đó có kèm privacy manifest không.

### 4.4 Xin quyền
- [ ] **Push:** chỉ xin quyền **khi có ngữ cảnh** (sau lần login đầu, hiện màn giải thích "Nhận thông báo khi có yêu cầu duyệt mới"), **không** xin ngay khi mở app. Từ chối thì app vẫn dùng bình thường.
- [ ] Không xin quyền nào không dùng (camera, vị trí, danh bạ…). Rà lại quyền mà các thư viện tự thêm vào sau khi prebuild.
- [ ] Chuỗi mô tả quyền (purpose string) rõ ràng, đúng sự thật, có bản tiếng Anh.

---

## 5. Build hygiene cho bản production

- [ ] Build bằng profile `production` (`APP_VARIANT=production`). Kiểm tra bundle id, tên app, icon **không** có nhãn DEV/QAS.
- [ ] **Không tồn tại** trong binary: route `dev-settings`, công tắc đổi backend, nút test push, log debug, endpoint QAS/LAN. Không chỉ ẩn mà phải **không được build vào** (route không đăng ký, code bị loại theo biến thể).
- [ ] BFF PRD: tắt endpoint `POST /push/test` và các endpoint debug (`/tasks/debug/*`).
- [ ] Không có chữ "beta", "test", "demo", placeholder, lorem ipsum hay màn hình trống trong UI.
- [ ] `ITSAppUsesNonExemptEncryption: false` trong `ios.infoPlist` (app chỉ dùng HTTPS chuẩn), để không bị hỏi export compliance mỗi lần upload.
- [ ] Version và build number tăng đúng (`appVersionSource: "remote"`, `autoIncrement`).
- [ ] Bản production **không** trỏ tới EAS Update channel `preview`.

---

## 6. Chất lượng & chức năng

### 6.1 Ổn định
- [ ] Không crash trên **iOS mới nhất** và phiên bản tối thiểu hỗ trợ, trên iPhone **và iPad**.
- [ ] Không có địa chỉ IPv4 hardcode. App chạy trên mạng **IPv6 / NAT64** (Apple review trên mạng IPv6). Thử bằng NAT64 của macOS Internet Sharing nếu có máy Mac.
- [ ] Mất mạng, server lỗi hoặc token hết hạn đều có thông báo rõ ràng và nút thử lại, không treo hay màn trắng.
- [ ] Loại chứng từ chưa hỗ trợ hiển thị view tối giản cùng thông báo, **không** in key OData thô (xem P9 trong [02-approval-core-refactor.md](./02-approval-core-refactor.md)).

### 6.2 iPad & màn lớn
- [ ] Bật `supportsTablet: true` thì mọi màn hình phải dùng tốt trên iPad dọc/ngang, Split View, Stage Manager (layout hai cột, xem guide mục 6).
- [ ] Không khoá orientation.
- [ ] Có screenshot iPad trong metadata.

### 6.3 Tính năng tối thiểu và trải nghiệm native
- [ ] App là native thật (NativeTabs, native stack, sheet), không phải web wrapper (Apple 4.2).
- [ ] Mọi nút đều làm đúng việc của nó, không có tính năng "coming soon".
- [ ] Đăng nhập dùng trình duyệt hệ thống (`expo-auth-session`). Không có ô nhập mật khẩu tự làm trong app.
- [ ] Logout hoạt động và xoá dữ liệu cục bộ.

### 6.4 Những yêu cầu không áp dụng (ghi rõ trong Review Notes nếu cần)
- **Account deletion (5.1.1(v)):** app không tạo tài khoản. Tài khoản do Entra của công ty quản lý.
- **Sign in with Apple (4.8):** không bắt buộc với app dùng hệ thống tài khoản doanh nghiệp của chính công ty.
- **In-App Purchase:** không có giao dịch.

---

## 7. Metadata App Store Connect / Play Console

- [ ] Tên, phụ đề, mô tả **đúng với chức năng thật**, nêu rõ đây là app dành cho nhân viên <Company>.
- [ ] Screenshot thật của bản production: iPhone (kích thước lớn nhất mà App Store Connect yêu cầu) và iPad. Dữ liệu trên screenshot là dữ liệu demo, không lộ số liệu thật.
- [ ] Danh mục: Business. Độ tuổi: điền questionnaire (không có nội dung nhạy cảm).
- [ ] Thông tin liên hệ cho App Review và tài khoản demo (§3).
- [ ] Copyright, support URL, privacy policy URL.

---

## 8. Quy trình nộp & xử lý khi bị reject

1. **Hai tuần trước khi nộp:** chốt kênh phân phối (§2). Gửi form Unlisted nếu cần. Tạo tài khoản demo và dữ liệu (§3). Có privacy policy URL.
2. **Một tuần trước:** build `production`, test theo §5–§6 trên máy thật (iPhone, iPad, Android). Chuẩn bị video và Review Notes.
3. **Nộp:** kiểm tra lại tài khoản demo đăng nhập được ngay trước khi bấm Submit.
4. **Bị reject:**
   - Đọc kỹ guideline được trích dẫn. Trả lời trong Resolution Center **ngắn gọn và lịch sự**, kèm bằng chứng (video, ảnh).
   - Lỗi đăng nhập hoặc dữ liệu: kiểm tra sign-in log của user demo, sửa rồi trả lời, thường không cần build mới.
   - Không đồng ý với quyết định: dùng quy trình appeal của Apple.
5. Sau khi được duyệt: phát hành theo kênh đã chọn, đổi mật khẩu tài khoản demo, ghi lại bài học vào file này.

---

## 9. Checklist nhanh trước khi bấm Submit

- [ ] Kênh phân phối đã chốt (Custom App / Unlisted), form đã được duyệt nếu cần
- [ ] Tài khoản demo đăng nhập được trên một máy **không** quản lý bởi công ty, không MFA
- [ ] Dữ liệu demo đủ cho mọi loại chứng từ, có attachment
- [ ] Review Notes + video demo
- [ ] Privacy policy URL, support URL, App Privacy, privacy manifest
- [ ] Bản production sạch: không dev-settings, nhãn DEV/QAS, endpoint test hay debug
- [ ] Đã test iPhone + iPad (dọc/ngang), mạng chập chờn, token hết hạn
- [ ] Quyền push chỉ được xin khi có ngữ cảnh
- [ ] `ITSAppUsesNonExemptEncryption` đã khai báo
- [ ] Screenshot iPhone + iPad dùng dữ liệu demo
