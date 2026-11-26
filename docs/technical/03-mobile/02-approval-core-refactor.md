# approval-core — Làm sạch Renderer chứng từ

> **Owner:** Project Team | **Last Updated:** 2026-11-03 | **Status:** Đã thực hiện trên branch `feat/approval-core` (trừ các mục ghi "Hoãn")
>
> **Phạm vi:** `app/cnma_approval_ui/src/renderers/` (registry, core, objects PO/PR/Claim/Reservation) và các chỗ web dùng nó.
>
> **Nguyên tắc:** refactor **giữ nguyên những gì người dùng thấy**. Output bị khoá bằng golden snapshot. Mọi thay đổi hiển thị phải là có chủ đích và được review.

---

## 1. Mục tiêu

1. Renderer **không phụ thuộc UI** (không React, DOM, class CSS, không import tầng page của web), để sau này mobile dùng lại được.
2. Output có **kind** (`text`, `codeText`, `amount`, `quantity`, `date`) để mỗi nền tảng trình bày đúng chuẩn của nó.
3. Thêm loại chứng từ mới **chỉ bằng một folder + đăng ký module**.
4. Nhanh trên thiết bị yếu, kể cả chứng từ nhiều line item.
5. Code ngắn, một cách làm cho mỗi việc, dễ maintain.

**Không tách package riêng (`package.json`).** Hiện chưa có kế hoạch dùng cho app khác. Renderer vẫn nằm trong web ở `src/renderers/`. Ranh giới import đã được ESLint chặn, nên khi dựng mobile chỉ cần trỏ alias tới thư mục này hoặc chuyển thư mục; quyết định cụ thể để tới lúc scaffold app mobile.

---

## 2. Vấn đề ban đầu và cách đã xử lý

| # | Vấn đề | Xử lý |
|---|---|---|
| P1 | Class Tailwind trong core (`textClass`, `stripeClass`, `before:bg-info`) | ✅ Core chỉ trả `tone`. `TaskCard.tsx` map tone → class trong `TONE_CLASSES` |
| P2 | Output chỉ là chuỗi, `dataType` khai báo nhưng không dùng | ✅ `DetailField.kind` có kiểu. `EMPTY_VALUE` được export để nền tảng nhận biết ô rỗng. Bỏ `dataType` chết trong `OverviewPanel` |
| P3 | Nhãn tiếng Anh viết cứng | ⏸ **Hoãn.** Thêm bản dịch tiếng Việt sẽ làm đổi giao diện ở chế độ vi, cần business duyệt danh sách nhãn |
| P4 | Locale không nhất quán | ✅ Phần không đổi hiển thị: gom về `DEFAULT_NUMBER_LOCALE`, `CLAIM_AMOUNT_LOCALE`, `CHIP_QUANTITY_LOCALE`, mỗi hằng số có ghi chú. ⏸ Hoãn việc thống nhất locale theo ngôn ngữ người dùng (sẽ đổi hiển thị) |
| P5 | Nhận diện loại chứng từ lặp ở registry, `resolveTaskCardStyle` và `TaskCard` | ✅ `ObjectTypeModule` (category, label, aliases, tone, resolveView) cùng `OBJECT_TYPE_MODULES` và `findObjectTypeModule()`. `TaskCard` dùng `label` của module |
| P6 | Hai cách định nghĩa field (khai báo + formatter) | ✅ Mọi factory sinh `formatter`, nên evaluator chỉ còn một nhánh. Bỏ `code/text/value/currency/unit` khỏi definition |
| P7 | `getRecordVal` quét `Object.keys` mỗi lần trượt | ✅ `core/record.ts`: cache index lowercase theo record (WeakMap), cache tách path `A\|B` |
| P8 | Code chết và trùng | ✅ Xoá `shared/base.builder.ts`, `shared/formatters.ts`, `TaskDetailSections.shared.ts`, `TaskDetailSections.types.ts`, `renderer.types.ts` và test của hàm chết. Xoá `normalizeAndOrderTableColumns` (luôn no-op vì mọi bảng có `preserveOrder`) cùng bộ lọc bảng legacy ("Header Facts"…). Xoá cột không dùng (`unit`, `zMakOrder*`) và field trùng `zubHeaderText`. `formatFileSize` chuyển về `pages/Inbox/utils/formatters.ts` |
| P9 | Loại chưa biết in toàn bộ key OData thô | ✅ **Thay đổi hiển thị có chủ đích:** `objects/generic/generic.views.ts` chỉ hiện các field chung có dữ liệu (số chứng từ, loại, người tạo, ngày tạo, tổng tiền) |
| P10 | Core import `@/pages/Inbox/utils/formatters` | ✅ `parseDate`, `formatAmountWithCurrency`, `formatDateShortLocale` chuyển vào `core/formatters.ts`. File của page re-export lại nên các import cũ vẫn chạy |

---

## 3. Cấu trúc hiện tại

```text
src/renderers/
├── index.ts                     # Public API — web chỉ import từ '@/renderers'
├── ObjectView.registry.ts       # OBJECT_TYPE_MODULES, findObjectTypeModule, readDocCategory/readDocumentType, resolveObjectViewDefinition
├── resolvers.ts                 # resolveBusinessSectionModel, resolveTaskCardConfigForTask (entry points cho UI)
├── core/
│   ├── types.ts                 # FieldDefinition, CardDefinition, TableColumnDefinition, ObjectViewDefinition, Tone, FieldKind, ObjectTypeModule
│   ├── model.ts                 # Output: BusinessSectionModel, DetailField (value + kind), EMPTY_VALUE
│   ├── record.ts                # getRecordVal / getRecordCode (A|B fallback, cached case-insensitive lookup)
│   ├── formatters.ts            # Formatter thuần, cache Intl.NumberFormat / DateTimeFormat
│   ├── fields.ts                # text, codeText, amount, quantity, date, tableCol, chip, excludeColumns
│   ├── predicates.ts            # when.*
│   ├── objectView.ts            # resolveObjectView, evalField, evalColumn (thuần)
│   └── taskCardView.ts          # extractTaskEntityRecord, evalTaskCardChips
└── objects/
    ├── pr/      pr.fields.ts · pr.views.ts (PR_VIEWS + prModule)
    ├── po/      po.fields.ts · po.views.ts (PO_VIEWS + poModule)
    ├── claim/   claim.fields.ts · claim.views.ts (CLAIM_VIEW + claimModule)
    ├── reservation/ reservation.fields.ts · reservation.views.ts (RESERVATION_VIEW + reservationModule)
    └── generic/ generic.views.ts (GENERIC_VIEW cho loại chưa biết)
```

**Ranh giới:** ESLint (`eslint.config.js`) chặn trong `src/renderers/**`: import `react*`, `@cnma/react-ui`, `lucide-react`, `framer-motion`, `@/pages/*`, `@/components/*`, `@/hooks/*`, `@/lib/*`, và các global `window`, `document`, `localStorage`, `sessionStorage`. Phụ thuộc bên ngoài duy nhất là **type** từ `@/services/inbox/inbox.types|contracts`.

**Views gọn hơn:** `prView()` / `poView()` sinh view cho từng subtype. Các biến thể cột lấy từ `excludeColumns()`, kèm comment ghi rõ yêu cầu nghiệp vụ, ví dụ `ZCOR: reference PR removed per requirements`.

---

## 4. Kiểm chứng

| Hạng mục | Kết quả |
|---|---|
| Golden snapshot (35 case: 8 subtype PR, 12 subtype PO, Claim, Reservation, bản ghi thưa, các dạng input, 9 dạng task card) | **Khớp 100%** với output trước refactor. Golden chụp phần hiển thị (bỏ trường `kind` mới thêm) và không phụ thuộc múi giờ máy (đã thử với `TZ=America/New_York`) |
| Test mới `tests/renderers/registry.test.ts` (14 test) | Registry/alias, tone, view tổng quát cho loại chưa biết, `kind`, quy tắc `text()` giữ formatter (CLAUDE.md), thêm loại mới chỉ bằng định nghĩa, `getRecordVal` |
| Toàn bộ test web | 41 file, 384 test pass |
| Test backend (root) | 16 file, 258 test pass |
| `npx tsc --noEmit` (web) | Sạch |
| ESLint `src/renderers` | Sạch (gồm cả rule ranh giới) |
| `vite build` | Build thành công |
| **Hiệu năng:** PO 200 dòng × 14 cột, Node, trung bình 20 lần | **~17 ms → ~1.4 ms (nhanh hơn ~12 lần)**. Giảm chủ yếu nhờ cache `Intl` và index key |
| Quy mô code `src/renderers` | 2.169 → 1.466 dòng |

**Chưa kiểm chứng:** chưa mở UI web để nhìn tận mắt (cần backend và đăng nhập). Phần hiển thị được khoá bằng golden test; các class Tailwind của TaskCard được giữ nguyên chuỗi.

---

## 5. Thay đổi có chủ đích

1. **Loại chứng từ chưa biết** (không thuộc PR/PO/Claim/Reservation): không còn liệt kê key OData thô, chỉ hiện các field chung có dữ liệu. Backend hiện chỉ trả 4 loại nên thực tế hầu như không gặp.
2. `getRecordCode()` ép currency/unit sang chuỗi. Với dữ liệu thật (luôn là chuỗi) kết quả không đổi; trước đây giá trị kiểu số có thể làm lỗi `toUpperCase`.

---

## 6. Việc tiếp theo (hoãn, cần quyết định)

| Việc | Vì sao hoãn |
|---|---|
| i18n nhãn field/card (`labelKey` + bản dịch vi) | Đổi giao diện ở chế độ tiếng Việt, cần business duyệt nhãn |
| Locale theo ngôn ngữ người dùng (ngày, số) | Đổi cách hiển thị số/ngày hiện tại. Cần thống nhất (ví dụ Claim đang dùng `vi-VN`, số lượng trong chip dùng `vi-VN`, còn lại `en-US`) |
| Giảm các chuỗi fallback `A\|B\|C` | Cần BFF chuẩn hoá key trước |
| Đưa renderer cho mobile dùng chung | Làm khi scaffold app mobile: chọn alias tới `src/renderers` hoặc chuyển thư mục, không cần package riêng |
