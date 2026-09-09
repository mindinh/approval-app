# Kế hoạch điều chỉnh Task List: Nhóm 4 Section mở rộng, Infinite Loading, Nút Scroll/Collapse & Icon Cảm xúc theo ngày

## Mục tiêu
1. **Không chuyển màn hình (No screen switching)**: Loại bỏ việc chuyển màn hình trung gian trên mobile. Hiển thị danh sách nhóm theo 4 loại section trực tiếp (PR, PO, Reservation, Claim form) đúng theo mockup thiết kế đã cung cấp.
2. **Accordion Expand & Infinite Loading**: Khi bấm vào từng section card thì section đó sẽ expand mở rộng ra để hiển thị danh sách các task tương ứng, hỗ trợ infinite loading khi cuộn danh sách.
3. **Nút Floating Action Button ở góc dưới bên phải**: Bấm vào để cuộn mượt mà lên đầu trang (scroll to top) và thu gọn lại tất cả các section (collapse all).
4. **Mood Icon theo thời gian tồn tại**:
   - Task tồn tại **trên 5 ngày**: hiển thị icon phẫn nộ (Angry - màu đỏ/rose).
   - Task mới **dưới 5 ngày**: hiển thị icon vui (Smile - màu xanh lá/emerald).

---

## Chi tiết các thay đổi

### 1. `TaskCard.tsx` — Thêm Mood Icon theo tuổi của Task
- Tính thời gian tồn tại dựa trên `task.createdOn`:
  ```ts
  const createdDate = task.createdOn ? new Date(task.createdOn) : null;
  const isOverdue5Days = createdDate && !isNaN(createdDate.getTime())
      ? (Date.now() - createdDate.getTime()) > 5 * 24 * 60 * 60 * 1000
      : false;
  ```
- Thêm icon `Angry` (khi > 5 ngày, đỏ) và `Smile` (khi <= 5 ngày, xanh) ở:
  - Header: cạnh badge trạng thái
  - Footer: cạnh icon đồng hồ và thời gian tạo task

### 2. `CategoryAccordionGroup.tsx` (Component mới) — 4 Section Cards chuẩn Mockup
- Tạo component chứa 4 section card:
  - **PR**: Viền trái đỏ (`bg-red-500`), icon văn bản đỏ (`bg-red-50 text-red-500`), tiêu đề `PR`, badge `X / Y pending`, nút `View` + chevron down.
  - **PO**: Viền trái xanh dương (`bg-blue-600`), icon hộp xanh (`bg-blue-50 text-blue-600`), tiêu đề `PO`, badge `X / Y pending`.
  - **Reservation**: Viền trái tím (`bg-purple-600`), icon lịch tím (`bg-purple-50 text-purple-600`), tiêu đề `Reservation`, badge `X / Y pending`.
  - **Claim form**: Viền trái xanh lục (`bg-emerald-600`), icon hóa đơn xanh (`bg-emerald-50 text-emerald-600`), tiêu đề `Claim form`, badge `X / Y pending`.
- Hiệu ứng bung mở mềm mại với Framer Motion.
- Mỗi section mở ra sẽ render danh sách `TaskCard`.
- Tích hợp sentinel IntersectionObserver cho infinite loading khi người dùng cuộn đến cuối section mở rộng.

### 3. Thêm Nút Nổi Bottom-Right: Scroll to Top & Collapse All trong `TaskList.tsx`
- Nút FAB nổi ở góc dưới bên phải (trên mobile cách đáy phù hợp để không che bottom nav bar).
- Khi bấm:
  - Cuộn mượt mà lên đầu trang: `scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })`.
  - Thu gọn tất cả các section đang mở: `setExpandedCategories(new Set())`.
- Icon `ChevronsUp` / `ArrowUp` kèm tooltip rõ ràng.

### 4. `InboxPage.tsx` — Loại bỏ việc chuyển màn hình trên Mobile
- Thay vì phân nhánh `!selectedCategory ? <CategoryHubView /> : <TaskList />`, hiển thị trực tiếp `TaskList` chứa 4 section accordion group.
- Khi bấm chọn task, mở `TaskDetailView`. Bấm quay lại sẽ về ngay danh sách 4 section.

### 5. Từ điển i18n
- Bổ sung các bản dịch tiếng Anh và tiếng Việt trong `en.json` và `vi.json`.

---

## Kế hoạch kiểm thử
1. Chạy `npm run typecheck` để đảm bảo code TypeScript không có lỗi.
2. Kiểm tra giao diện mở rộng/thu gọn của 4 section.
3. Kiểm tra tính năng infinite scroll tải thêm task.
4. Kiểm tra nút nổi góc dưới bên phải cuộn lên đầu và thu gọn danh sách.
5. Kiểm tra hiển thị icon Angry / Smile trên các task > 5 ngày và <= 5 ngày.
