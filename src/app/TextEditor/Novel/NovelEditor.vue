<template>
  <div :class="$style.wrapper">  <!-- Wrapper để isolate toàn bộ -->
    <EditorContent :editor="editor">
      <EditorCommand :className="$style.commandMenu">  <!-- Pass class hashed cho isolation -->
        <EditorCommandEmpty :className="$style.commandEmpty">No results</EditorCommandEmpty>
        <EditorCommandList>
          <EditorCommandItem
              v-for="item in suggestionItems"
              :key="item.title"
              :value="item.title"
              @command="(val) => item.command(val)"
              :className="$style.commandItem">  <!-- Pass class cho mỗi item -->
            <div :class="$style.iconWrapper">
              {{ item.icon }}  <!-- Giả sử icon là text/emoji, nếu là component thì import -->
            </div>
            <div>
              <p :class="$style.itemTitle">{{ item.title }}</p>
              <p :class="$style.itemDesc">{{ item.description }}</p>
            </div>
          </EditorCommandItem>
        </EditorCommandList>
      </EditorCommand>
    </EditorContent>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Editor } from '@tiptap/vue-3';
import Suggestion from '@tiptap/suggestion';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';

// Định nghĩa suggestionItems (dựa trên hình bạn, có thể extend thêm)
const suggestionItems = ref([
  { title: 'Continue writing', description: 'Use AI to expand your thoughts.', icon: '✨', command: (val) => console.log('Continue:', val) },
  { title: 'Send Feedback', description: 'Let us know how we can improve.', icon: '📝', command: (val) => console.log('Feedback:', val) },
  { title: 'Text', description: 'Just start typing with plain text.', icon: '≡', command: (val) => console.log('Text:', val) },
  { title: 'To-do List', description: 'Track tasks with a to-do list.', icon: '✔', command: (val) => console.log('Todo:', val) },
  { title: 'Heading 1', description: 'Big section heading.', icon: 'H1', command: (val) => console.log('H1:', val) },
  { title: 'Heading 2', description: 'Medium section heading.', icon: 'H2', command: (val) => console.log('H2:', val) },
  { title: 'Heading 3', description: 'Small section heading.', icon: 'H3', command: (val) => console.log('H3:', val) },
  // Add thêm item nếu cần
]);

// Setup Tiptap editor với Suggestion cho slash commands
const editor = ref<Editor | null>(null);
onMounted(() => {
  editor.value = new Editor({
    extensions: [
      StarterKit,
      Suggestion.configure({
        suggestion: {
          items: ({ query }) => {
            // Filter items dựa trên query (khi gõ /)
            return suggestionItems.value.filter(item => item.title.toLowerCase().startsWith(query.toLowerCase()));
          },
          render: () => {
            // Render menu slash (tích hợp với component)
            return {
              onStart: props => { /* Logic render */ },
              // ... (xem docs Tiptap để full config)
            };
          },
        },
      }),
    ],
    content: '<p>Gõ / để mở menu...</p>',
  });
});

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<style module>
/* CSS Modules: Tất cả class sẽ hashed unique, độc lập hoàn toàn */
.wrapper {
  all: initial;  /* Reset inherit từ global/parent, không bị ảnh hưởng */
  position: relative;  /* Để menu popup đúng vị trí */
  display: block;
  isolation: isolate;  /* CSS isolation để ngăn leak (hỗ trợ browser mới) */
}

.commandMenu {
  z-index: 50;
  height: auto;
  max-height: 330px;
  width: 18rem;  /* 72 * 0.25rem = 18rem, match w-72 */
  overflow-y: auto;
  border-radius: 0.375rem;  /* rounded-md */
  border: 1px solid #d1d5db;  /* border-muted, giả sử gray */
  background-color: white;  /* bg-background */
  padding: 0.5rem;  /* px-1 py-2 */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);  /* shadow-md */
  transition: all 0.2s;
}

.commandEmpty {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  color: #6b7280;  /* text-muted-foreground */
}

.commandItem {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;  /* space-x-2 */
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;  /* py-1 px-2 */
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
}

.commandItem:hover,
.commandItem[aria-selected] {
  background-color: #f3f4f6;  /* hover:bg-accent */
}

.iconWrapper {
  display: flex;
  height: 2.5rem;
  width: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;  /* border-muted */
  background-color: white;
}

.itemTitle {
  font-weight: 500;  /* font-medium */
}

.itemDesc {
  font-size: 0.75rem;  /* text-xs */
  color: #6b7280;  /* text-muted-foreground */
}
</style>