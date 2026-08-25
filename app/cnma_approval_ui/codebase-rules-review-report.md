# Codebase Rules & Styling Review Report

Generated at: 2026-08-24T02:46:44.005Z

This report lists all detected codebase violations based on the zero-tolerance styling and component rules.

## §0 Hardcoded Pixels (`[10px]`, `w-[180px]`) (23 issues)

### File: `src/components/PwaInstallBanner.tsx`
- [ ] **Line 139**: Hardcoded pixels/units in className: '-[10px]' ``` className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium" ```

### File: `src/components/common/ErrorBoundary.tsx`
- [ ] **Line 53**: Hardcoded pixels/units in className: '-[11px]' ``` className="whitespace-pre-wrap break-words text-[11px]" ```

### File: `src/components/filterbar/FilterSettingsDialog.tsx`
- [ ] **Line 109**: Hardcoded pixels/units in className: '-[44px]' ``` className="text-primary h-auto p-0 text-xs min-h-[44px] sm:min-h-0 flex items-center" ```
- [ ] **Line 124**: Hardcoded pixels/units in className: '-[44px]' ``` className={`flex items-center gap-2 px-2 py-2.5 cursor-pointer transition-colors min-h-[44px] ${
    ```

### File: `src/components/skeletons/DashboardSkeleton.tsx`
- [ ] **Line 25**: Hardcoded pixels/units in className: '-[20px]' ``` className="relative w-44 h-44 rounded-full border-[20px] border-muted flex items-center justify-cent ```

### File: `src/pages/Inbox/InboxPage.tsx`
- [ ] **Line 294**: Hardcoded pixels/units in className: '-[52px]' ``` className="px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 flex items-center justify-between s ```

### File: `src/pages/Inbox/components/ForwardTaskDialog.tsx`
- [ ] **Line 99**: Hardcoded pixels/units in className: '-[48px]' ``` className={`p-2.5 min-h-[48px] cursor-pointer flex items-center justify-between transition-colors ho ```

### File: `src/pages/Inbox/components/RichMentionInput.tsx`
- [ ] **Line 187**: Hardcoded pixels/units in className: '-[88px]' ``` className="min-h-[88px] max-h-[160px] p-3 rounded-lg border border-border/60 bg-card text-foreground ```

### File: `src/pages/Inbox/components/TagUserDialog.tsx`
- [ ] **Line 123**: Hardcoded pixels/units in className: '-[48px]' ``` className={`p-2.5 min-h-[48px] cursor-pointer flex items-center justify-between transition-colors ho ```

### File: `src/pages/Inbox/components/TaskCard.tsx`
- [ ] **Line 168**: Hardcoded pixels/units in className: '-[11px]' ``` className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-0.5 rou ```
- [ ] **Line 265**: Hardcoded pixels/units in className: '-[11px]' ``` className={cn(
                                'inline-flex items-center gap-1 px-2 py-0.5 rounded-f ```

### File: `src/pages/Inbox/components/TeamsMentionDropdown.tsx`
- [ ] **Line 109**: Hardcoded pixels/units in className: '-[11px]' ``` className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b ```
- [ ] **Line 138**: Hardcoded pixels/units in className: '-[11px]' ``` className="size-7 rounded-full bg-gradient-to-br from-primary/80 to-primary text-primary-foreground  ```
- [ ] **Line 146**: Hardcoded pixels/units in className: '-[11px]' ``` className="text-[11px] text-muted-foreground truncate leading-snug" ```

### File: `src/pages/Inbox/components/TextViewer.tsx`
- [ ] **Line 60**: Hardcoded pixels/units in className: '-[40px]' ``` className="flex items-center justify-between pl-4 pr-14 py-2 bg-slate-950/90 border-b border-slate-8 ```
- [ ] **Line 67**: Hardcoded pixels/units in className: '-[11px]' ``` className="text-[11px] text-slate-400/80 shrink-0 tabular-nums" ```
- [ ] **Line 105**: Hardcoded pixels/units in className: '-[11px]' ``` className="w-10 pr-3 text-right text-slate-500/70 select-none text-[11px] group-hover:text-slate-300 ```

### File: `src/pages/Inbox/components/panels/OverviewPanel.tsx`
- [ ] **Line 92**: Hardcoded pixels/units in className: '-[2.25rem]' ``` className="flex items-start justify-between gap-3 py-2 border-b border-border/20 last:border-b-0 min ```
- [ ] **Line 116**: Hardcoded pixels/units in className: '-[3rem]' ``` className="flex flex-col gap-1 min-h-[3rem]" ```
- [ ] **Line 117**: Hardcoded pixels/units in className: '-[10px]' ``` className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold opacity-80" ```
- [ ] **Line 120**: Hardcoded pixels/units in className: '-[1.5rem]' ``` className="flex items-start min-h-[1.5rem]" ```
- [ ] **Line 153**: Hardcoded pixels/units in className: '-[4.5rem]' ``` className="flex flex-col gap-1.5 min-h-[4.5rem]" ```
- [ ] **Line 154**: Hardcoded pixels/units in className: '-[10px]' ``` className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold opacity-80" ```

---

## §0 Hardcoded Hex Colors (`[#ffffff]`) (0 issues)

🎉 **No issues found in this category!**

---

## §0 Raw Tailwind Colors (`bg-red-500`, `text-blue-500`) (50 issues)

### File: `src/components/common/ErrorModal.tsx`
- [ ] **Line 61**: Raw Tailwind color used: 'text-amber-500' ``` className="size-5 text-amber-500" ```
- [ ] **Line 63**: Raw Tailwind color used: 'text-sky-500' ``` className="size-5 text-sky-500" ```
- [ ] **Line 65**: Raw Tailwind color used: 'text-slate-500' ``` className="size-5 text-slate-500" ```
- [ ] **Line 67**: Raw Tailwind color used: 'text-orange-500' ``` className="size-5 text-orange-500" ```
- [ ] **Line 122**: Raw Tailwind color used: 'bg-slate-950' ``` className="border-t border-border/40 px-3 py-2.5 text-xs font-mono space-y-1.5 bg-slate-950 text-sla ```
- [ ] **Line 125**: Raw Tailwind color used: 'text-slate-400' ``` className="text-slate-400" ```
- [ ] **Line 126**: Raw Tailwind color used: 'text-amber-400' ``` className="text-amber-400" ```
- [ ] **Line 131**: Raw Tailwind color used: 'text-slate-400' ``` className="text-slate-400" ```
- [ ] **Line 132**: Raw Tailwind color used: 'text-slate-300' ``` className="text-slate-300" ```
- [ ] **Line 137**: Raw Tailwind color used: 'text-slate-400' ``` className="text-slate-400" ```
- [ ] **Line 138**: Raw Tailwind color used: 'text-slate-200' ``` className="mt-0.5 whitespace-pre-wrap text-slate-200 break-words leading-snug" ```
- [ ] **Line 159**: Raw Tailwind color used: 'text-emerald-600' ``` className="size-3.5 text-emerald-600" ```

### File: `src/pages/Inbox/components/ForwardTaskDialog.tsx`
- [ ] **Line 60**: Raw Tailwind color used: 'text-blue-600' ``` className="w-5 h-5 text-blue-600" ```
- [ ] **Line 63**: Raw Tailwind color used: 'text-gray-500' ``` className="text-sm text-gray-500" ```
- [ ] **Line 73**: Raw Tailwind color used: 'text-gray-700' ``` className="text-sm font-medium text-gray-700" ```
- [ ] **Line 75**: Raw Tailwind color used: 'text-gray-400' ``` className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" ```
- [ ] **Line 86**: Raw Tailwind color used: 'text-blue-500' ``` className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-blue-500" ```
- [ ] **Line 91**: Raw Tailwind color used: 'divide-gray-100' ``` className="mt-2 border rounded-md max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white shadow- ```
- [ ] **Line 99**: Raw Tailwind color used: 'bg-blue-50' ``` className={`p-2.5 min-h-[48px] cursor-pointer flex items-center justify-between transition-colors ho ```
- [ ] **Line 103**: Raw Tailwind color used: 'bg-slate-100' ``` className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-me ```
- [ ] **Line 107**: Raw Tailwind color used: 'text-gray-900' ``` className="text-sm font-medium text-gray-900 truncate" ```
- [ ] **Line 108**: Raw Tailwind color used: 'text-gray-500' ``` className="text-xs text-gray-500 font-normal" ```
- [ ] **Line 110**: Raw Tailwind color used: 'text-gray-500' ``` className="flex items-center gap-3 text-xs text-gray-500 mt-0.5" ```
- [ ] **Line 112**: Raw Tailwind color used: 'text-gray-400' ``` className="w-3 h-3 text-gray-400" ```
- [ ] **Line 118**: Raw Tailwind color used: 'text-blue-600' ``` className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2" ```
- [ ] **Line 123**: Raw Tailwind color used: 'text-gray-500' ``` className="p-4 text-center text-xs text-gray-500" ```
- [ ] **Line 127**: Raw Tailwind color used: 'text-gray-400' ``` className="p-3 text-center text-xs text-gray-400" ```
- [ ] **Line 136**: Raw Tailwind color used: 'bg-blue-50' ``` className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between" ```
- [ ] **Line 138**: Raw Tailwind color used: 'text-blue-600' ``` className="w-4 h-4 text-blue-600" ```
- [ ] **Line 139**: Raw Tailwind color used: 'text-blue-900' ``` className="text-sm font-medium text-blue-900" ```
- [ ] **Line 147**: Raw Tailwind color used: 'text-blue-700' ``` className="h-11 sm:h-9 px-2 text-xs text-blue-700 hover:text-blue-900" ```
- [ ] **Line 156**: Raw Tailwind color used: 'text-gray-700' ``` className="text-sm font-medium text-gray-700" ```
- [ ] **Line 177**: Raw Tailwind color used: 'bg-blue-600' ``` className="bg-blue-600 hover:bg-blue-700 text-white h-11 sm:h-9 rounded-xl font-semibold" ```

### File: `src/pages/Inbox/components/TaskBadges.tsx`
- [ ] **Line 102**: Raw Tailwind color used: 'border-amber-300' ``` className="px-2.5 py-0.5 text-xs font-normal border-amber-300/40 bg-amber-500/10 text-amber-600 dark ```

### File: `src/pages/Inbox/components/TextViewer.tsx`
- [ ] **Line 58**: Raw Tailwind color used: 'bg-slate-900' ``` className="w-full h-full flex flex-col bg-slate-900 text-slate-100 font-mono text-xs overflow-hidden ```
- [ ] **Line 60**: Raw Tailwind color used: 'bg-slate-950' ``` className="flex items-center justify-between pl-4 pr-14 py-2 bg-slate-950/90 border-b border-slate-8 ```
- [ ] **Line 62**: Raw Tailwind color used: 'text-emerald-400' ``` className="size-4 text-emerald-400 shrink-0" ```
- [ ] **Line 63**: Raw Tailwind color used: 'text-slate-200' ``` className="truncate font-medium text-slate-200 text-xs" ```
- [ ] **Line 67**: Raw Tailwind color used: 'text-slate-400' ``` className="text-[11px] text-slate-400/80 shrink-0 tabular-nums" ```
- [ ] **Line 77**: Raw Tailwind color used: 'text-slate-200' ``` className="h-7 px-2.5 text-xs text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white bor ```
- [ ] **Line 79**: Raw Tailwind color used: 'text-emerald-400' ``` className="size-3.5 text-emerald-400" ```
- [ ] **Line 86**: Raw Tailwind color used: 'bg-slate-900' ``` className="flex-1 overflow-auto p-3 leading-relaxed bg-slate-900" ```
- [ ] **Line 88**: Raw Tailwind color used: 'text-slate-400' ``` className="flex flex-col items-center justify-center h-full gap-2 text-slate-400" ```
- [ ] **Line 89**: Raw Tailwind color used: 'text-emerald-400' ``` className="size-6 animate-spin text-emerald-400" ```
- [ ] **Line 95**: Raw Tailwind color used: 'text-red-400' ``` className="flex items-center justify-center h-full text-red-400 text-xs" ```
- [ ] **Line 104**: Raw Tailwind color used: 'bg-slate-800' ``` className="hover:bg-slate-800/60 group transition-colors" ```
- [ ] **Line 105**: Raw Tailwind color used: 'text-slate-500' ``` className="w-10 pr-3 text-right text-slate-500/70 select-none text-[11px] group-hover:text-slate-300 ```
- [ ] **Line 108**: Raw Tailwind color used: 'text-slate-200' ``` className="pl-3 whitespace-pre-wrap break-all text-slate-200 font-mono" ```

### File: `src/pages/Inbox/components/panels/DetailsPanel.tsx`
- [ ] **Line 254**: Raw Tailwind color used: 'bg-red-50' ``` className={cn(
                                                "p-4 space-y-3 rounded-2xl border bg ```
- [ ] **Line 307**: Raw Tailwind color used: 'bg-red-50' ``` className={cn(
                                                "group relative gap-0 rounded-xl bor ```

---

## §0 Raw HTML Component Primitives (`<button>`, `<input>`) (0 issues)

🎉 **No issues found in this category!**

---

## §0 Inline Styles (`style={{ ... }}`) (0 issues)

🎉 **No issues found in this category!**

---

## §0 Local Status/Color Mappings (4 issues)

### File: `src/pages/Dashboard/use-dashboard-data.ts`
- [ ] **Line 83**: Local color/status map 'PO' defined. Move to StatusBadge or theme/constants. ``` { name: 'PO (Purchase Order)', fill: 'var(--info, #0070f2)', border: '#80b8f9', bg: '#e1f4ff', text: ```
- [ ] **Line 84**: Local color/status map 'PR' defined. Move to StatusBadge or theme/constants. ``` { name: 'PR (Purchase Requisition)', fill: 'var(--color-brand, #cc0000)', border: '#990000', bg: '#f ```
- [ ] **Line 85**: Local color/status map 'RESV' defined. Move to StatusBadge or theme/constants. ``` { name: 'Reservation (RESV)', fill: 'var(--warning, #e76500)', border: '#f3b280', bg: '#fff8d6', tex ```
- [ ] **Line 86**: Local color/status map 'OTHER' defined. Move to StatusBadge or theme/constants. ``` { name: 'Other / Claims', fill: 'var(--success, #30914c)', border: '#98c8a6', bg: '#f5fae5', text: ' ```

---

## §6 i18n / Hardcoded UI Text (104 issues)

### File: `src/components/PwaInstallBanner.tsx`
- [ ] **Line 141**: Hardcoded JSX Text: "Safari → Share → Add to Home Screen" ``` Safari → Share → Add to Home Screen ```

### File: `src/components/common/ErrorBoundary.tsx`
- [ ] **Line 43**: Hardcoded JSX Text: "Application Error" ``` Application Error ```
- [ ] **Line 51**: Hardcoded JSX Text: "Technical Details & Stack Trace" ``` Technical Details & Stack Trace ```
- [ ] **Line 60**: Hardcoded JSX Text: "Reload Application" ``` Reload Application ```

### File: `src/components/common/ErrorModal.tsx`
- [ ] **Line 125**: Hardcoded JSX Text: "Status Code:" ``` Status Code: ```
- [ ] **Line 131**: Hardcoded JSX Text: "Endpoint:" ``` Endpoint: ```
- [ ] **Line 137**: Hardcoded JSX Text: "Raw Message:" ``` Raw Message: ```

### File: `src/components/filterbar/FilterBar.tsx`
- [ ] **Line 101**: Hardcoded JSX Text: "Filters" ``` Filters ```
- [ ] **Line 117**: Hardcoded JSX Text: "Clear" ``` Clear ```
- [ ] **Line 146**: Hardcoded JSX Text: "Go" ``` Go ```
- [ ] **Line 155**: Hardcoded attribute [title]: "Adapt Filter" ``` title="Adapt Filter" ```
- [ ] **Line 183**: Hardcoded attribute [title]: "Clear Filters" ``` title="Clear Filters" ```

### File: `src/components/filterbar/FilterBarField.tsx`
- [ ] **Line 78**: Hardcoded JSX Text: "Clear" ``` Clear ```
- [ ] **Line 115**: Hardcoded JSX Text: "All" ``` All ```

### File: `src/components/filterbar/FilterSettingsDialog.tsx`
- [ ] **Line 86**: Hardcoded JSX Text: "Adapt Filter" ``` Adapt Filter ```
- [ ] **Line 95**: Hardcoded attribute [placeholder]: "Search" ``` placeholder="Search" ```
- [ ] **Line 105**: Hardcoded JSX Text: "Field (" ``` Field ( ```
- [ ] **Line 141**: Hardcoded attribute [title]: "Move to top" ``` title="Move to top" ```
- [ ] **Line 151**: Hardcoded attribute [title]: "Move up" ``` title="Move up" ```
- [ ] **Line 161**: Hardcoded attribute [title]: "Move down" ``` title="Move down" ```
- [ ] **Line 171**: Hardcoded attribute [title]: "Move to bottom" ``` title="Move to bottom" ```
- [ ] **Line 184**: Hardcoded JSX Text: "Cancel" ``` Cancel ```
- [ ] **Line 185**: Hardcoded JSX Text: "OK" ``` OK ```

### File: `src/components/filterbar/MobileMultiSelectFilter.tsx`
- [ ] **Line 162**: Hardcoded attribute [placeholder]: "Search options..." ``` placeholder="Search options..." ```
- [ ] **Line 179**: Hardcoded JSX Text: "of" ``` of ```
- [ ] **Line 179**: Hardcoded JSX Text: "selected" ``` selected ```
- [ ] **Line 190**: Hardcoded JSX Text: "Select All" ``` Select All ```
- [ ] **Line 200**: Hardcoded JSX Text: "Clear" ``` Clear ```
- [ ] **Line 215**: Hardcoded JSX Text: "Loading options..." ``` Loading options... ```
- [ ] **Line 219**: Hardcoded JSX Text: "No options match "" ``` No options match " ```
- [ ] **Line 255**: Hardcoded JSX Text: "Select" ``` Select ```
- [ ] **Line 258**: Hardcoded JSX Text: "selected" ``` selected ```

### File: `src/components/layouts/MainLayout.tsx`
- [ ] **Line 229**: Hardcoded JSX Text: "prorequest" ``` prorequest ```

### File: `src/components/providers/SessionTimeoutProvider.tsx`
- [ ] **Line 163**: Hardcoded JSX Text: "Due to inactivity, you are going to be signed out in" ``` Due to inactivity, you are going to be signed out in ```
- [ ] **Line 165**: Hardcoded JSX Text: "Second" ``` Second ```
- [ ] **Line 169**: Hardcoded JSX Text: "Your session has expired. Please sign in again to continue working." ``` Your session has expired. Please sign in again to continue working. ```
- [ ] **Line 184**: Hardcoded JSX Text: "Continue Working" ``` Continue Working ```
- [ ] **Line 191**: Hardcoded JSX Text: "Sign Out" ``` Sign Out ```
- [ ] **Line 200**: Hardcoded JSX Text: "Sign In Again" ``` Sign In Again ```

### File: `src/pages/Home/HomePage.tsx`
- [ ] **Line 110**: Hardcoded attribute [aria-label]: "Open navigation menu" ``` aria-label="Open navigation menu" ```

### File: `src/pages/Inbox/components/AttachmentPreviewModal.tsx`
- [ ] **Line 59**: Hardcoded attribute [title]: "Close preview" ``` title="Close preview" ```
- [ ] **Line 121**: Hardcoded attribute [title]: "Zoom out" ``` title="Zoom out" ```
- [ ] **Line 133**: Hardcoded attribute [title]: "Zoom in" ``` title="Zoom in" ```
- [ ] **Line 143**: Hardcoded attribute [title]: "Rotate" ``` title="Rotate" ```
- [ ] **Line 156**: Hardcoded attribute [title]: "Download" ``` title="Download" ```
- [ ] **Line 204**: Hardcoded JSX Text: "Loading document viewer…" ``` Loading document viewer… ```
- [ ] **Line 244**: Hardcoded JSX Text: "Preview is not available for this file type." ``` Preview is not available for this file type. ```
- [ ] **Line 260**: Hardcoded JSX Text: "Download File" ``` Download File ```

### File: `src/pages/Inbox/components/DocxViewer.tsx`
- [ ] **Line 56**: Hardcoded JSX Text: "Rendering Word document..." ``` Rendering Word document... ```

### File: `src/pages/Inbox/components/ExcelViewer.tsx`
- [ ] **Line 67**: Hardcoded JSX Text: "Rendering Excel spreadsheet..." ``` Rendering Excel spreadsheet... ```

### File: `src/pages/Inbox/components/MassActionBar.tsx`
- [ ] **Line 56**: Hardcoded JSX Text: "selected" ``` selected ```
- [ ] **Line 70**: Hardcoded JSX Text: "Reject (" ``` Reject ( ```
- [ ] **Line 82**: Hardcoded JSX Text: "Approve (" ``` Approve ( ```

### File: `src/pages/Inbox/components/MassSelectionView.tsx`
- [ ] **Line 41**: Hardcoded JSX Text: "Select tasks to view summary" ``` Select tasks to view summary ```
- [ ] **Line 44**: Hardcoded JSX Text: "Use the checkboxes in the task list to select multiple tasks" ``` Use the checkboxes in the task list to select multiple tasks ```
- [ ] **Line 57**: Hardcoded JSX Text: "Task Summary" ``` Task Summary ```
- [ ] **Line 60**: Hardcoded JSX Text: "task" ``` task ```
- [ ] **Line 60**: Hardcoded JSX Text: "selected for mass action" ``` selected for mass action ```
- [ ] **Line 64**: Hardcoded JSX Text: "selected" ``` selected ```
- [ ] **Line 86**: Hardcoded JSX Text: "Task Title" ``` Task Title ```
- [ ] **Line 89**: Hardcoded JSX Text: "Requestor" ``` Requestor ```
- [ ] **Line 92**: Hardcoded JSX Text: "Document" ``` Document ```
- [ ] **Line 95**: Hardcoded JSX Text: "Type" ``` Type ```
- [ ] **Line 98**: Hardcoded JSX Text: "Priority" ``` Priority ```
- [ ] **Line 101**: Hardcoded JSX Text: "Status" ``` Status ```
- [ ] **Line 104**: Hardcoded JSX Text: "Created On" ``` Created On ```
- [ ] **Line 163**: Hardcoded JSX Text: "task" ``` task ```
- [ ] **Line 163**: Hardcoded JSX Text: "selected" ``` selected ```
- [ ] **Line 173**: Hardcoded JSX Text: "Reject (" ``` Reject ( ```
- [ ] **Line 183**: Hardcoded JSX Text: "Approve (" ``` Approve ( ```

### File: `src/pages/Inbox/components/ReferencePrDetailView.tsx`
- [ ] **Line 48**: Hardcoded JSX Text: "PR #" ``` PR # ```
- [ ] **Line 77**: Hardcoded JSX Text: "S/4HANA Live" ``` S/4HANA Live ```
- [ ] **Line 92**: Hardcoded JSX Text: "PR #" ``` PR # ```

### File: `src/pages/Inbox/components/TaskActionPanel.tsx`
- [ ] **Line 199**: Hardcoded JSX Text: "Comment" ``` Comment ```
- [ ] **Line 225**: Hardcoded JSX Text: "Cancel" ``` Cancel ```

### File: `src/pages/Inbox/components/TaskCard.tsx`
- [ ] **Line 188**: Hardcoded JSX Text: "Requestor:" ``` Requestor: ```
- [ ] **Line 285**: Hardcoded JSX Text: "Requestor:" ``` Requestor: ```

### File: `src/pages/Inbox/components/TaskPagination.tsx`
- [ ] **Line 34**: Hardcoded JSX Text: "Prev" ``` Prev ```
- [ ] **Line 37**: Hardcoded JSX Text: "Page" ``` Page ```
- [ ] **Line 37**: Hardcoded JSX Text: "of" ``` of ```
- [ ] **Line 38**: Hardcoded JSX Text: "- Loading..." ``` - Loading... ```
- [ ] **Line 47**: Hardcoded JSX Text: "Next" ``` Next ```

### File: `src/pages/Inbox/components/TextViewer.tsx`
- [ ] **Line 68**: Hardcoded JSX Text: "lines," ``` lines, ```
- [ ] **Line 68**: Hardcoded JSX Text: "chars)" ``` chars) ```
- [ ] **Line 90**: Hardcoded JSX Text: "Loading text file..." ``` Loading text file... ```

### File: `src/pages/Inbox/components/panels/AttachmentsPanel.tsx`
- [ ] **Line 178**: Hardcoded JSX Text: "Loading attachments..." ``` Loading attachments... ```
- [ ] **Line 224**: Hardcoded JSX Text: "Tap to view" ``` Tap to view ```
- [ ] **Line 275**: Hardcoded JSX Text: "Attachments" ``` Attachments ```
- [ ] **Line 276**: Hardcoded JSX Text: "Files and links attached to this task" ``` Files and links attached to this task ```
- [ ] **Line 301**: Hardcoded JSX Text: "Loading attachments..." ``` Loading attachments... ```

### File: `src/pages/Inbox/components/panels/CommentsPanel.tsx`
- [ ] **Line 187**: Hardcoded JSX Text: "Loading comments..." ``` Loading comments... ```
- [ ] **Line 191**: Hardcoded JSX Text: "No comments yet." ``` No comments yet. ```
- [ ] **Line 234**: Hardcoded attribute [placeholder]: "Write a comment... (Type '@' to mention someone)" ``` placeholder="Write a comment... (Type '@' to mention someone)" ```
- [ ] **Line 240**: Hardcoded JSX Text: "Ctrl+Enter to submit" ``` Ctrl+Enter to submit ```
- [ ] **Line 254**: Hardcoded JSX Text: "Add Comment" ``` Add Comment ```

### File: `src/pages/Inbox/components/panels/WorkflowApprovalPanel.tsx`
- [ ] **Line 46**: Hardcoded JSX Text: "Workflow Progress" ``` Workflow Progress ```
- [ ] **Line 50**: Hardcoded JSX Text: "Loading workflow approval steps..." ``` Loading workflow approval steps... ```
- [ ] **Line 62**: Hardcoded JSX Text: "No workflow approval steps found for this task." ``` No workflow approval steps found for this task. ```
- [ ] **Line 122**: Hardcoded JSX Text: "Level" ``` Level ```
- [ ] **Line 127**: Hardcoded JSX Text: "Code" ``` Code ```
- [ ] **Line 137**: Hardcoded JSX Text: "Current" ``` Current ```
- [ ] **Line 138**: Hardcoded JSX Text: "Next" ``` Next ```
- [ ] **Line 144**: Hardcoded JSX Text: "Status:" ``` Status: ```
- [ ] **Line 155**: Hardcoded JSX Text: "Approved Date:" ``` Approved Date: ```

---

## Summary

- Total Issues Found: **181**
  - §0 Hardcoded Pixels: **23**
  - §0 Hardcoded Hex Colors: **0**
  - §0 Raw Tailwind Colors: **50**
  - §0 Raw HTML Component Primitives: **0**
  - §0 Inline Styles: **0**
  - §0 Local Status/Color Mappings: **4**
  - §6 i18n / Hardcoded UI Text: **104**

Fix these issues to align with the Lead React Frontend Engineer guidelines.
