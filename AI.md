
chào bạn

mình muốn xử lý BrowserTabContainer4 (BrowserTab4, RequestBrowserTabManager4...)

1 - Logic và style giống 100% bản 2
2 - Bản 2 đang bị kết dính, mình muốn bản 4: Container quản lý tab
2.1. Luôn có 2 slot để outside truyền data:
    + slot: tabs, mỗi 1 phần tử luôn là BrowserTab4 (chứa thông tin về title, body)
    + slot: tab-new-content: chỉ chứa 1 phần tử BrowserTab4 (là title + body khi thêm mới 1 tab)
2.2. Container chỉ quản lý tab, nội dung 100% truyền từ outside thông qua slot tabs, và tab-new-content

3 - Bổ sung các event listener cho Container:
    + @tab-added: outside save localstorage
    + @tab-activated
    + @tab-closed: outside save localstorage
    + @tab-body-changed: outside save localstorage
    + @tab-title-changed: outside save localstorage
