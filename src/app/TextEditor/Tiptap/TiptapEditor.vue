<template>
  <div class="editor-wrap" ref="wrapRef">
    <EditorContent :editor="editor" class="editor" />

    <button
        v-if="handle.visible"
        class="block-handle"
        :style="{ top: handle.top + 'px' }"
        @mousedown.prevent.stop="openMenuForCurrentBlock"
        title="Turn into"
    >
      ☰
    </button>

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

const props = defineProps<{
  storageKey: string
}>()

const wrapRef = ref<HTMLElement>()
const editor = ref<Editor>()

// ---- Menu state ----
const menu = reactive({
  show: false,
  x: 0,
  y: 0,
  fromPos: 0,
  query: '',
  mode: 'slash' as 'slash' | 'turn',
})

// ---- Drag handle state ----
const handle = reactive({
  visible: false,
  top: 0,
})

const items: any[] = [
  { label: 'Heading 1', run: ed => ed.chain().focus().toggleHeading({ level: 1 }).run(), keywords: ['h1'] },
  { label: 'Heading 2', run: ed => ed.chain().focus().toggleHeading({ level: 2 }).run(), keywords: ['h2'] },
  { label: 'Bullet List', run: ed => ed.chain().focus().toggleBulletList().run(), keywords: ['ul'] },
  { label: 'Ordered List', run: ed => ed.chain().focus().toggleOrderedList().run(), keywords: ['ol'] },
  { label: 'Paragraph', run: ed => ed.chain().focus().setParagraph().run(), keywords: ['p'] },
]

const filteredItems = computed(() => {
  const q = menu.query.trim().toLowerCase()
  if (!q) return items
  return items.filter(it => it.label.toLowerCase().includes(q))
})

const closeMenu = () => {
  menu.show = false
  menu.query = ''
}

const run = (it: any) => {
  if (!editor.value) return
  if (menu.mode === 'slash') {
    const pos = menu.fromPos
    editor.value.chain().setTextSelection({ from: pos - 1, to: pos }).deleteSelection().run()
  }
  it.run(editor.value)
  closeMenu()
}

const openMenuForCurrentBlock = async () => {
  menu.mode = 'turn'
  menu.show = true
  await nextTick()
}

onMounted(() => {
  const savedContent = localStorage.getItem(props.storageKey)

  editor.value = new Editor({
    extensions: [StarterKit],
    content: savedContent || '<p>Bắt đầu ghi chú tại đây...</p>',
    onUpdate: ({ editor }) => {
      localStorage.setItem(props.storageKey, editor.getHTML())
    },
    onSelectionUpdate: ({ editor: ed }) => {
      if (!wrapRef.value) return
      const { from } = ed.state.selection
      const coords = ed.view.coordsAtPos(from)
      const wrapRect = wrapRef.value.getBoundingClientRect()
      handle.visible = true
      handle.top = coords.top - wrapRect.top
    }
  })
})

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.editor-wrap {
  position: relative;
  background: transparent; /* Nền trong suốt */
  min-height: 200px;
  padding: 10px;
  overflow: hidden;
}

.editor :deep(.ProseMirror) {
  min-height: 180px;
  outline: none;
  background: transparent !important;
}

.block-handle {
  position: absolute;
  left: -20px;
  cursor: pointer;
  background: transparent;
  border: none;
}

.slash-menu {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  z-index: 100;
}
</style>
