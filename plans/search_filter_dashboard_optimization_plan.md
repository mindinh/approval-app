# Tối ưu hóa Search & Filter, Lazy Load Tabs, Infinite Scroll và Dashboard Performance

## Tổng quan vấn đề
1. **Search & Filter giật lag**: 
   - Không có debounce cho ô search input; mỗi phím gõ đều re-render toàn bộ danh sách.
   - Đoạn `useEffect` trong `TaskList.tsx:314` tự động gọi chuỗi đệ quy `onLoadMore()` tải hết toàn bộ database về client ngay khi người dùng gõ ký tự đầu tiên.
2. **Infinite Scroll tải sạch toàn bộ ngay khi mở trang**:
   - Thẻ sentinel nằm ngay dưới 4 header accordion bị đóng (~200px) nên lọt thẳng vào màn hình (`isIntersecting = true`) ngay lập tức $\rightarrow$ kích hoạt tải liên tục toàn bộ các trang.
3. **Tải thừa dữ liệu giữa My Tasks và Approved Tasks**:
   - Đang ở tab "My Tasks" nhưng vẫn tải ngầm "Approved Tasks" (và ngược lại) để đếm số lượng thủ công trên mảng client-side.
4. **Dashboard 1000 items cutoff & lag**:
   - Backend fetch 1000 items gần nhất từ SAP OData (`$top=1000`). Frontend chạy vòng lặp đếm trên 1000 items này; nếu 1 type có trên 1000 items thì các type khác bị đếm thành 0.
   - Bảng Dashboard render trực tiếp toàn bộ 1000 dòng vào DOM mà không phân trang, gây nghẽn trình duyệt (main thread freeze) và giật lag khi tương tác biểu đồ.

---

## Các thay đổi đề xuất

### 1. Backend: Bổ sung endpoint thống kê Category Counts & tối ưu Dashboard

#### [MODIFY] [sap-odata-adapter.ts](file:///d:/learning/test/cnma_approval/srv/lib/integrations/sap-odata-adapter.ts)
- Bổ sung phương thức `getCategoryCount(sapUser, statuses, docCategoryFilter, userJwt)` sử dụng `$top=0&$count=true` lên entity `CNMA_WFTASK` để đếm chính xác số lượng từ database SAP trong vài mili-giây.

#### [MODIFY] [inbox-processor.ts](file:///d:/learning/test/cnma_approval/srv/lib/processors/inbox-processor.ts)
- Bổ sung `getCategoryCounts(sapUser, scope, userJwt)`: Chạy song song 4 query nhẹ lấy count chuẩn của 4 categories (PR, PO, RESERVATION, CLAIM) cho scope hiện tại (`my` hoặc `approved`).
- Cập nhật `getDashboardSummary`: Đảm bảo `docTypeCounts` (`CNMA_TASKBYDOCTYPE`) và `statusCounts` (`CNMA_TASKBYSTATUS`) luôn được chuyển đầy đủ về client.

#### [MODIFY] [inbox-controller.ts](file:///d:/learning/test/cnma_approval/srv/controllers/inbox-controller.ts) & [inbox-handler.ts](file:///d:/learning/test/cnma_approval/srv/handlers/inbox-handler.ts)
- Đăng ký route `GET /category-counts?scope=my|approved`.

---

### 2. Frontend Inbox: Debounce Search, Lazy Load Tabs & Fix Sentinel

#### [MODIFY] [inbox.api.ts](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/services/inbox/inbox.api.ts) & [inboxQueries.ts](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/hooks/inboxQueries.ts)
- Thêm API call `getCategoryCounts(scope)` và hook `useCategoryCounts(scope)`.

#### [MODIFY] [InboxPage.tsx](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/InboxPage.tsx)
- **Lazy load tab**: Chỉ kích hoạt `useInfiniteTasks` khi `scope === 'my'`, và chỉ kích hoạt `useInfiniteApprovedTasks` khi `scope === 'approved'` (`enabled: isMyScope` / `enabled: !isMyScope`).
- Sử dụng counts từ `useCategoryCounts(scope)` thay vì chạy vòng lặp đếm trên mảng tasks tải ngầm.

#### [MODIFY] [TaskList.tsx](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskList.tsx)
- **Fix Infinite Scroll Sentinel**: Không cho phép sentinel ngoài tự động trigger khi tất cả accordion đang đóng (`expandedCategories.size === 0`). Sentinel chỉ hoạt động khi user đã mở accordion và cuộn xuống gần đáy.
- **Loại bỏ vòng lặp auto-fetch vô tận** (`useEffect` ở dòng 314-324).
- **Thêm Search Debounce (350ms)**: Tạo local search state với debounce trước khi cập nhật `appliedValues.search`.

---

### 3. Frontend Dashboard: Khắc phục 1000 Item Cutoff & Phân trang Table

#### [MODIFY] [use-dashboard-data.ts](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Dashboard/use-dashboard-data.ts)
- **Khắc phục 1000 item cutoff**:
  - `categoryCounts` và `typesData` được tổng hợp trực tiếp từ `docTypeCounts` (`CNMA_TASKBYDOCTYPE`) của SAP khi có dữ liệu. Kể cả PO có 10.000 items thì PR, Claim, Reservation vẫn có số lượng đếm chuẩn 100% từ SAP mà không bao giờ bị biến thành 0.

#### [MODIFY] [DashboardPage.tsx](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Dashboard/DashboardPage.tsx)
- **Thêm phân trang (Pagination)** cho bảng Task Details Table:
  - Mặc định 15 hoặc 20 items / trang.
  - Thêm bộ điều hướng: `Showing (page - 1) * pageSize + 1 to min(...) of total` cùng 2 nút `Previous` / `Next`.
  - Giảm số lượng DOM node render cùng lúc từ 5.000+ xuống còn ~100 nodes.
  - Bảng cuộn mượt mà ngay lập tức, animation chuyển đổi filter biểu đồ đạt 60fps.

---

## Kế hoạch kiểm thử (Verification Plan)

### 1. Kiểm thử Automated Build & Typecheck
- Chạy `npm run typecheck` trong `app/cnma_approval_ui` để đảm bảo không có lỗi TypeScript.
- Chạy `npx cds-tsc` hoặc kiểm tra build backend.

### 2. Kiểm thử Chức năng
- **My Tasks & Approved Tasks**:
  - Mở My Tasks: Kiểm tra Network tab chỉ có request của My Tasks, KHÔNG fetch Approved Tasks.
  - Mở Approved Tasks: Chỉ fetch Approved Tasks.
  - Kiểm tra số lượng đếm trên header accordion hiển thị chính xác.
  - Kiểm tra scroll: Khi accordion đóng, chỉ tải đúng 1 trang đầu (50 items), không tự động tải toàn bộ.
  - Kiểm tra ô Search: Gõ phím liên tục mượt mà, sau 350ms mới áp dụng bộ lọc.
- **Dashboard**:
  - Kiểm tra 4 category cards: Các category khác (PR, Claim, Reservation) không bị biến thành 0.
  - Kiểm tra bảng chi tiết: Phân trang 15 dòng/trang hoạt động trơn tru.
