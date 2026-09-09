# Báo cáo kết quả: Nhóm 4 Section Accordion, Infinite Loading, Nút Scroll/Collapse & Icon Trạng thái theo ngày

## Tổng quan các công việc đã hoàn thành

### 1. Thêm Icon cảm xúc (Mood Icons) theo thời gian tồn tại của Task
- **File**: [TaskCard.tsx](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskCard.tsx)
- **Cơ chế**:
  - Dựa trên `task.createdOn`, tính số ngày tồn tại: `(Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)`.
  - **Tồn tại trên 5 ngày**: Hiển thị icon **phẫn nộ** (`Angry` màu đỏ / `text-rose-600 bg-rose-50 border-rose-200`), tooltip "Pending > 5 days".
  - **Mới dưới hoặc bằng 5 ngày**: Hiển thị icon **vui** (`Smile` màu xanh lá / `text-emerald-600 bg-emerald-50 border-emerald-200`), tooltip "New task (< 5 days)".
- **Vị trí hiển thị**:
  - Cạnh badges trạng thái ở hàng header (`TaskTypeBadge`, `StatusBadge`).
  - Cạnh icon đồng hồ và chuỗi thời gian tạo ở footer (`formatDistanceToNow`).
  - Hoạt động mượt mà trên cả giao diện Desktop và Mobile.

---

### 2. Tạo Component 4 Section Accordion theo chuẩn Mockup
- **File**: [CategoryAccordionGroup.tsx](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/CategoryAccordionGroup.tsx)
- **Thiết kế theo đúng mockup**:
  - **PR**: Vạch chỉ thị trái màu đỏ (`bg-red-500`), icon `FileText` đỏ trong nền `bg-red-50 text-red-500 border-red-100`, tiêu đề **PR**, badge `${pending} / ${total} pending`, nút `View`/`Hide` và chevron xoay.
  - **PO**: Vạch chỉ thị trái xanh dương (`bg-blue-600`), icon `Package` xanh trong `bg-blue-50 text-blue-600 border-blue-100`, tiêu đề **PO**, badge `${pending} / ${total} pending`.
  - **Reservation**: Vạch chỉ thị trái tím (`bg-purple-600`), icon `CalendarCheck` tím trong `bg-purple-50 text-purple-600 border-purple-100`, tiêu đề **Reservation**, badge `${pending} / ${total} pending`.
  - **Claim form**: Vạch chỉ thị trái xanh lục (`bg-emerald-600`), icon `Receipt` xanh trong `bg-emerald-50 text-emerald-600 border-emerald-100`, tiêu đề **Claim form**, badge `${pending} / ${total} pending`.
- **Hiệu ứng**:
  - Mở rộng / thu gọn mượt mà với `framer-motion` (`AnimatePresence`).
  - Cho phép người dùng linh hoạt mở rộng nhiều section cùng lúc hoặc thu gọn độc lập.

---

### 3. Tích hợp Infinite Loading trong danh sách mở rộng
- **File**: [CategoryAccordionGroup.tsx](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/CategoryAccordionGroup.tsx) & [TaskList.tsx](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskList.tsx)
- **Cơ chế**:
  - Trong mỗi section mở rộng, đặt sentinel `IntersectionObserver` ở cuối danh sách task.
  - Khi người dùng cuộn xem đến cuối danh sách: Nếu server còn task (`hasNextPage && !isFetchingNextPage`), tự động kích hoạt `onLoadMore()` (`activeTasksQuery.fetchNextPage()`).
  - Hiển thị spinner `Loader2` "Loading more..." khi đang tải.
  - Khi server trả về trang tiếp theo, các task mới sẽ tự động phân loại vào các section tương ứng mà không làm gián đoạn vị trí cuộn hay trạng thái mở rộng.
  - Khi đã tải hết toàn bộ task: hiển thị thông báo "All tasks loaded".

---

### 4. Nút Floating Action Button ở góc dưới bên phải: Scroll to Top & Collapse All
- **File**: [TaskList.tsx](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/components/TaskList.tsx)
- **Vị trí**:
  - Trên Mobile: `fixed bottom-20 right-4 z-40` (nổi tinh tế phía trên thanh bottom bar điều hướng).
  - Trên Desktop: `absolute bottom-5 right-4 z-20` (ở góc dưới bên phải khung danh sách task).
- **Thiết kế**:
  - Nút tròn nổi với `backdrop-blur-md`, viền `border border-border/80`, bóng đổ `shadow-lg`, hiệu ứng tương tác `active:scale-95`.
  - Icon `ChevronsUp` màu primary với hiệu ứng lơ lửng khi rê chuột.
- **Tính năng**:
  - Bấm vào nút:
    1. Cuộn mượt mà lên đầu trang: `scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })`.
    2. Thu gọn tất cả các section đang mở: `setExpandedCategories(new Set())`.

---

### 5. Loại bỏ việc chuyển màn hình trung gian trên Mobile
- **File**: [InboxPage.tsx](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/pages/Inbox/InboxPage.tsx)
- **Cải tiến**:
  - Xóa bỏ luồng điều hướng 2 màn hình cũ (`CategoryHubView` -> bấm thẻ -> chuyển sang `TaskList`).
  - Khi người dùng vào Inbox (My Tasks hoặc Approved Tasks), hiển thị trực tiếp danh sách nhóm 4 section.
  - Khi bấm vào task cụ thể, màn hình chuyển sang xem chi tiết `TaskDetailView`.
  - Nút Back từ trang chi tiết quay lại ngay danh sách 4 section mà không phải qua thêm màn hình trung gian nào.

---

### 6. Cập nhật Đa ngôn ngữ (i18n)
- **Files**: [en.json](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/locales/en.json) & [vi.json](file:///d:/learning/test/cnma_approval/app/cnma_approval_ui/src/locales/vi.json)
- Bổ sung đầy đủ nhãn và tooltip cho: `scrollToTopAndCollapse`, `view`, `hide`, `noTasksInCategory`, `overdue5Days`, `freshTask`.
