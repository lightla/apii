<script setup lang="ts">
import { computed, ref } from 'vue'
import CodeMirrorContainer2 from '@/app/Generals/CodeEditor/CodeMirrorContainer2.vue'
import { useRequestParamsStorage } from '@/storages/payload.ts'

const store = useRequestParamsStorage()
const theme = ref('one-dark')
const activeStage = ref<'pre' | 'post'>('pre')

const snippets = [
  {
    label: 'Set variable',
    code: "apii.env.set('{{token}}', 'value')",
  },
  {
    label: 'Get variable',
    code: "const token = apii.env.get('{{token}}')",
  },
  {
    label: 'Get response JSON value',
    code: "const accessToken = apii.response.json('accessToken')",
  },
]

const currentScript = computed({
  get: () => (activeStage.value === 'pre' ? store.preRequestScript : store.postRequestScript),
  set: (value: string) => {
    if (activeStage.value === 'pre') {
      store.preRequestScript = value
      return
    }
    store.postRequestScript = value
  }
})

const insertSnippet = (snippetCode: string) => {
  if (!snippetCode) return
  const script = currentScript.value || ''
  currentScript.value = script ? `${script}\n${snippetCode}` : snippetCode
}

const onSnippetChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  insertSnippet(target.value)
  target.value = ''
}
</script>

<template>
  <div class="script-tab-container">
    <div class="script-toolbar">
      <button
        class="stage-btn"
        :class="{ active: activeStage === 'pre' }"
        @click="activeStage = 'pre'"
      >
        Pre-request
      </button>
      <button
        class="stage-btn"
        :class="{ active: activeStage === 'post' }"
        @click="activeStage = 'post'"
      >
        Post-request
      </button>

      <select class="snippet-select" @change="onSnippetChange">
        <option value="">Insert snippet...</option>
        <option v-for="snippet in snippets" :key="snippet.label" :value="snippet.code">
          {{ snippet.label }}
        </option>
      </select>
    </div>

    <div class="script-editor-wrap">
      <CodeMirrorContainer2
        v-model="currentScript"
        :theme="theme"
        :show-copy="true"
        :show-beautify="false"
        @update:theme="theme = $event"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.script-tab-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.script-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid #888;
  background: #f0f0f0;
}

.stage-btn {
  height: 28px;
  padding: 0 10px;
  border: 1px solid #999;
  background: #fff;
  font-size: 12px;
  cursor: pointer;

  &.active {
    border-color: #007bff;
    background: #cfe2ff;
    color: #0056b3;
  }
}

.snippet-select {
  margin-left: auto;
  height: 28px;
  min-width: 180px;
  border: 1px solid #999;
  background: #fff;
  font-size: 12px;
  padding: 0 8px;
}

.script-editor-wrap {
  flex: 1;
  min-height: 0;
}
</style>
