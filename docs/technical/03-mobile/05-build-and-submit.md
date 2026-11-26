# CNMA Approval Mobile — Build & Submit (EAS)

> **Owner:** Project Team | **Last Updated:** 2026-11-16 | **Status:** Active
>
> Cách build app mobile (`app/cnma_approval_mobile`) bằng EAS Build và gửi lên TestFlight / cài APK Android.
> Trước khi nộp bản production lên store, đối chiếu thêm [03-store-review-checklist.md](./03-store-review-checklist.md).

---

## 1. Tổng quan

| Nền tảng | Profile (`eas.json`) | Kết quả | Phân phối |
|---|---|---|---|
| iOS | `production` | `.ipa` ký bằng distribution certificate | Tự động gửi lên **TestFlight** (`--auto-submit`) |
| Android | `preview` | `.apk` (internal distribution) | Tải từ link EAS, cài trực tiếp lên máy |
| Android | `production` | `.aab` | Chưa dùng — Google Play chưa cấu hình (xem mục 8) |

Thông tin dự án:

| Mục | Giá trị |
|---|---|
| EAS account / project | `minhdinh03s-team` / `cnma_approval_mobile` |
| EAS project ID | `52720743-2ccd-4a0a-afb4-bb2141c08854` (trong `app.json`) |
| Bundle ID / package | `com.conarum.prorequests4h` (iOS và Android) |
| App Store Connect app ID | `6833833834` |
| Apple Team ID | `79MU58UCKF` |
| App version | `expo.version` trong `app.json` (hiện `1.0.0`) |
| Build number | Do EAS quản lý (`appVersionSource: remote`), tự tăng mỗi lần build `production` |

Dashboard: https://expo.dev/accounts/minhdinh03s-team/projects/cnma_approval_mobile

> ℹ️ Chưa cấu hình EAS Update (OTA). **Mọi thay đổi** — kể cả chỉ sửa JS/UI — đều cần build mới để người dùng nhận được.

---

## 2. Chuẩn bị (một lần)

1. Node.js LTS và dependencies của app:

   ```bash
   cd app/cnma_approval_mobile
   ```

   ```bash
   npm install
   ```

2. Đăng nhập EAS bằng tài khoản có quyền trên `minhdinh03s-team` (CLI chạy qua `npx`, không cần cài global):

   ```bash
   npx eas-cli login
   ```

   ```bash
   npx eas-cli whoami
   ```

3. **App Store Connect API key** (để submit lên TestFlight). File `.p8` là bí mật: **không bao giờ commit** (`.gitignore` đã chặn `*.p8`). Cách khuyến nghị là lưu key trên EAS một lần, sau đó không cần đụng vào `eas.json` nữa:

   ```bash
   npx eas-cli credentials -p ios
   ```

   Chọn `production` → **App Store Connect: Manage your API Key** → **Set up your project to use an API Key for EAS Submit** → trỏ tới file `AuthKey_<KEY_ID>.p8`, nhập Key ID và Issuer ID (lấy trong App Store Connect › Users and Access › Integrations).

   > Cách tạm thời đã dùng trước đây: thêm `ascApiKeyPath`, `ascApiKeyIssuerId`, `ascApiKeyId` vào `submit.production.ios` trong `eas.json` ngay trước lệnh build và **khôi phục `eas.json` ngay sau đó**. Kiểm tra lại bằng `git diff app/cnma_approval_mobile/eas.json` — không được còn trường `ascApiKey*` khi commit.

4. Biến môi trường của app (`EXPO_PUBLIC_*`) **nằm trên EAS**, không lấy từ `.env.local` khi build cloud:

   | Biến | Ý nghĩa |
   |---|---|
   | `EXPO_PUBLIC_API_URL` | URL BFF (`…/api/cnma/APPROVAL_SRV`) |
   | `EXPO_PUBLIC_ENTRA_TENANT_ID` | Tenant Microsoft Entra |
   | `EXPO_PUBLIC_ENTRA_CLIENT_ID` | App registration của mobile |
   | `EXPO_PUBLIC_ENTRA_API_SCOPE` | Scope `api://…/access_as_user` |

   Xem hoặc sửa theo môi trường (`preview` dùng cho APK, `production` cho iOS):

   ```bash
   npx eas-cli env:list production
   ```

   ```bash
   npx eas-cli env:set production --name EXPO_PUBLIC_API_URL --value https://<bff-host>/api/cnma/APPROVAL_SRV
   ```

   Các giá trị này được nhúng vào bundle lúc build: đổi biến thì phải **build lại**. Không đặt bí mật (client secret, mật khẩu) vào `EXPO_PUBLIC_*`.

---

## 3. Kiểm tra trước khi build

Chạy trong `app/cnma_approval_mobile`; tất cả phải pass:

```bash
npm run typecheck
```

```bash
npm run lint
```

```bash
npm test
```

```bash
npx expo-doctor
```

Nếu có route mới mà typecheck báo lỗi kiểu `"/new-route" is not assignable…`, tạo lại typed routes bằng cách chạy `npx expo start` một lúc rồi dừng (file `.expo/types/router.d.ts` được sinh lại).

Kiểm tra nhanh bundle JS (bắt lỗi import/Metro mà typecheck không thấy):

```bash
npx expo export --platform ios --output-dir /tmp/exp-check
```

Nếu đổi plugin trong `app.json` (quyền, Info.plist…), kiểm tra cấu hình native đã resolve đúng, ví dụ chuỗi quyền Face ID:

```bash
npx expo config --type introspect --json
```

---

## 4. Build iOS và gửi lên TestFlight

```bash
npx eas-cli build --platform ios --profile production --auto-submit
```

- Thêm `--no-wait` để không giữ terminal; theo dõi trên dashboard hoặc `build:list`.
- Thêm `--non-interactive` khi chạy từ script/CI (khi đó credentials và ASC key phải sẵn trên EAS).
- Build number tự tăng (`autoIncrement: true`). Xem số hiện tại:

  ```bash
  npx eas-cli build:version:get -p ios -e production
  ```

- Đặt lại build number (lệnh này **chỉ chạy interactive** — gõ số trong terminal):

  ```bash
  npx eas-cli build:version:set -p ios -e production
  ```

  Ví dụ đặt `13` thì build kế tiếp là `14`. Build number đã dùng trên App Store Connect không được dùng lại.

Sau khi build xong, EAS gửi `.ipa` lên App Store Connect. Apple xử lý thêm khoảng 5–30 phút trước khi bản hiện trong TestFlight. `ios.config.usesNonExemptEncryption: false` đã khai báo trong `app.json`, nên không phải trả lời câu hỏi mã hoá.

Gửi lại một build đã có (không build lại):

```bash
npx eas-cli submit --platform ios --profile production --id <BUILD_ID>
```

---

## 5. Build Android APK

```bash
npx eas-cli build --platform android --profile preview
```

Xong build, mở link **Install** trên trang build (hoặc quét QR) bằng điện thoại Android để tải và cài APK. Máy cần cho phép cài app từ nguồn này.

---

## 6. Theo dõi build và submission

```bash
npx eas-cli build:list --limit 5
```

```bash
npx eas-cli build:view <BUILD_ID>
```

Submission (TestFlight) xem trên dashboard › **Submissions**. Lỗi build xem log từng bước (Install dependencies, Prebuild, Run fastlane / Gradle) trên trang build.

---

## 7. Checklist mỗi lần phát hành

- [ ] Mục 3 pass (typecheck, lint, test, expo-doctor, export).
- [ ] Đúng BFF/Entra cho môi trường (mục 2.4); BFF đã deploy nếu bản này cần endpoint mới.
- [ ] Đổi `expo.version` trong `app.json` khi phát hành bản mới cho người dùng (build number tự tăng).
- [ ] Build iOS + `--auto-submit`; build Android `preview` nếu cần APK.
- [ ] `eas.json` không chứa `ascApiKey*`; không có file `.p8`, `.env.local` nào được commit.
- [ ] Bản trong TestFlight test trên máy thật: đăng nhập, Inbox, Approve/Reject trên **task thử** (ghi thật vào SAP), comment/tag, attachment, Face ID.
- [ ] Ghi build number + link build vào changelog/ticket.

---

## 8. Google Play (chưa cấu hình)

Khi cần đưa lên Play Store:

1. Tạo app `com.conarum.prorequests4h` trên Google Play Console và upload thủ công bản `.aab` đầu tiên (Play yêu cầu lần đầu upload tay).
2. Tạo Google service account có quyền release, tải file JSON key, lưu lên EAS (`npx eas-cli credentials -p android` › Google Service Account) — không commit file JSON.
3. Thêm `submit.production.android` (ví dụ `track: "internal"`) vào `eas.json`.
4. Build `production` (ra `.aab`) và submit:

   ```bash
   npx eas-cli build --platform android --profile production --auto-submit
   ```

---

## 9. Sự cố thường gặp

| Hiện tượng | Nguyên nhân / cách xử lý |
|---|---|
| Face ID chỉ hỏi passcode | Thiếu `NSFaceIDUsageDescription`. Plugin `expo-secure-store` với `faceIDPermission: false` sẽ xoá chuỗi do `expo-local-authentication` thêm vào — hai plugin phải cùng một chuỗi. Kiểm tra bằng `npx expo config --type introspect --json`, sau đó build lại. |
| App build xong nhưng gọi sai server / không đăng nhập được | Biến `EXPO_PUBLIC_*` trên EAS sai môi trường (mục 2.4). Sửa biến rồi build lại. |
| `build:version:set` treo khi chạy từ script | Lệnh này cần nhập tay; chạy trong terminal thật. |
| Submit lỗi xác thực App Store Connect | ASC API key chưa lưu trên EAS hoặc đã bị thu hồi. Làm lại mục 2.3. |
| Build number trùng / bị Apple từ chối | Số đã dùng; đặt lại bằng `build:version:set` lớn hơn số cao nhất trên App Store Connect. |
| Thay đổi UI không thấy trên máy | Chưa có OTA: cần build mới và cập nhật bản TestFlight/APK. |
