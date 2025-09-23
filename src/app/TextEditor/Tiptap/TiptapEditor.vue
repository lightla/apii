<template>
  <div class="editor-wrap" ref="wrapRef">
    <EditorContent :editor="editor" class="editor" />

    <!-- Drag handle bên trái dòng hiện tại -->
    <button
        v-if="handle.visible"
        class="block-handle"
        :style="{ top: handle.top + 'px' }"
        @mousedown.prevent.stop="openMenuForCurrentBlock"
        title="Turn into"
    >
      ☰
    </button>

    <!-- Slash / Turn-into Menu -->
    <div
        v-if="menu.show"
        class="slash-menu"
        :style="{ top: menu.y + 'px', left: menu.x + 'px' }"
    >
      <input
          v-model="menu.query"
          class="slash-search"
          placeholder="Type to filter…"
          @keydown.stop
      />
      <div class="slash-items">
        <button
            v-for="(it, i) in filteredItems"
            :key="i"
            class="slash-item"
            @mousedown.prevent.stop="run(it)"
        >
          {{ it.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref, computed, nextTick } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { computePosition, offset, flip, shift } from '@floating-ui/dom'

type MenuItem = {
  label: string
  run: (ed: Editor) => void
  keywords?: string[]
}

const wrapRef = ref<HTMLElement>()
const editor = ref<Editor>()

// ---- Menu state ----
const menu = reactive({
  show: false,
  x: 0,
  y: 0,
  fromPos: 0,     // vị trí con trỏ khi mở menu bằng '/'
  query: '',
  mode: 'slash' as 'slash' | 'turn', // để bạn phân biệt slash hay turn-into
})

// ---- Drag handle state ----
const handle = reactive({
  visible: false,
  top: 0,
})

// ---- Các menu item: thêm/bớt tùy ý ----
const items: MenuItem[] = [
  { label: 'Heading 1', run: ed => ed.chain().focus().toggleHeading({ level: 1 }).run(), keywords: ['h1', 'title'] },
  { label: 'Heading 2', run: ed => ed.chain().focus().toggleHeading({ level: 2 }).run(), keywords: ['h2'] },
  { label: 'Bullet List', run: ed => ed.chain().focus().toggleBulletList().run(), keywords: ['ul', 'list'] },
  { label: 'Ordered List', run: ed => ed.chain().focus().toggleOrderedList().run(), keywords: ['ol', 'list'] },
  { label: 'Quote', run: ed => ed.chain().focus().toggleBlockquote().run(), keywords: ['quote'] },
  { label: 'Code Block', run: ed => ed.chain().focus().toggleCodeBlock().run(), keywords: ['code'] },
  { label: 'Paragraph', run: ed => ed.chain().focus().setParagraph().run(), keywords: ['p', 'text'] },
]

const filteredItems = computed(() => {
  const q = menu.query.trim().toLowerCase()
  if (!q) return items
  return items.filter(it => {
    if (it.label.toLowerCase().includes(q)) return true
    if (it.keywords?.some(k => k.toLowerCase().includes(q))) return true
    return false
  })
})

// ---- Helpers ----
const setSlashMenuAtSelection = async () => {
  if (!editor.value || !wrapRef.value) return
  const view = editor.value.view
  const { from } = editor.value.state.selection
  // anchor: node DOM tại selection
  const sel = view.domAtPos(from)
  const anchor =
      (sel.node as HTMLElement)?.nodeType === 3
          ? (sel.node.parentElement as HTMLElement)
          : (sel.node as HTMLElement)

  const wrapRect = wrapRef.value.getBoundingClientRect()
  const virt = {
    getBoundingClientRect: () => anchor.getBoundingClientRect(),
  } as any

  const { x, y } = await computePosition(virt, wrapRef.value, {
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  })

  menu.x = x - wrapRect.left
  menu.y = y - wrapRect.top
  menu.show = true
}

const setMenuAtBlockTop = async () => {
  if (!editor.value || !wrapRef.value) return
  const view = editor.value.view
  const { from } = editor.value.state.selection
  const coords = view.coordsAtPos(from)
  const wrapRect = wrapRef.value.getBoundingClientRect()
  menu.x = 40 // lệch phải một chút từ handle
  menu.y = coords.top - wrapRect.top
  menu.show = true
}

const closeMenu = () => {
  menu.show = false
  menu.query = ''
}

const run = (it: MenuItem) => {
  if (!editor.value) return
  // Nếu là slash-mode, xóa dấu '/'
  if (menu.mode === 'slash') {
    const pos = menu.fromPos
    // xóa 1 ký tự trước pos (dấu '/')
    editor.value.chain().setTextSelection({ from: pos - 1, to: pos }).deleteSelection().run()
  }
  it.run(editor.value)
  closeMenu()
}

const openMenuForCurrentBlock = async () => {
  menu.mode = 'turn'
  await setMenuAtBlockTop()
  await nextTick()
  // focus ô search để gõ filter
  const input = document.querySelector('.slash-search') as HTMLInputElement | null
  input?.focus()
}

// ---- Init Editor ----
onMounted(() => {
  editor.value = new Editor({
    extensions: [StarterKit],
    content: `<p>Gõ “/” để mở slash menu, hoặc hover bên trái rồi bấm ☰ để “Turn into”.</p><p></p>`,
    onSelectionUpdate: ({ editor: ed }) => {
      // Cập nhật vị trí handle theo selection hiện tại
      if (!wrapRef.value) return
      const { from } = ed.state.selection
      const coords = ed.view.coordsAtPos(from)
      const wrapRect = wrapRef.value.getBoundingClientRect()
      handle.visible = true
      handle.top = coords.top - wrapRect.top
    },
    onTransaction: ({ editor: ed }) => {
      // Khi người dùng gõ '/', mở slash menu đúng vị trí
      const { from } = ed.state.selection
      try {
        const lastChar = ed.state.doc.textBetween(from - 1, from, '\n')
        if (lastChar === '/') {
          menu.mode = 'slash'
          menu.fromPos = from
          setSlashMenuAtSelection()
          // tự động focus ô search
          setTimeout(() => {
            const input = document.querySelector('.slash-search') as HTMLInputElement | null
            input?.focus()
          }, 0)
        }
      } catch {}
    },
  })

  // Ẩn handle khi chuột rời khỏi editor
  const onLeave = (e: MouseEvent) => {
    const t = e.relatedTarget as HTMLElement | null
    if (!wrapRef.value?.contains(t)) {
      handle.visible = false
      closeMenu()
    }
  }
  wrapRef.value?.addEventListener('mouseleave', onLeave)

  // Đóng menu khi click ngoài
  const onDocClick = (e: MouseEvent) => {
    if (!wrapRef.value) return
    const target = e.target as Node
    if (!wrapRef.value.contains(target)) closeMenu()
  }
  document.addEventListener('mousedown', onDocClick)

  // cleanup
  onBeforeUnmount(() => {
    wrapRef.value?.removeEventListener('mouseleave', onLeave)
    document.removeEventListener('mousedown', onDocClick)
  })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.editor-wrap {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  min-height: 260px;
  padding: 18px 24px;
  overflow: hidden;
}

/* nội dung tiptap */
.editor :deep(.ProseMirror) {
  min-height: 220px;
  outline: none;
}

/* handle bên trái */
.block-handle {
  position: absolute;
  left: 6px;
  width: 24px;
  height: 24px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
}

/* menu */
.slash-menu {
  position: absolute;
  width: 240px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 12px 24px rgba(0,0,0,.12);
  padding: 8px;
  z-index: 50;
}
.slash-search {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 6px;
  outline: none;
}
.slash-items { max-height: 240px; overflow: auto; }
.slash-item {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
}
.slash-item:hover {
  background: #f3f4f6;
}
</style>
