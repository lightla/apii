<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  items: unknown[]
  height?: string | number
  striped?: boolean
  stickyHeader?: boolean
  loading?: boolean
}>(), {
  items: () => [],
  height: '320px',
  striped: true,
  stickyHeader: true,
  loading: false,
})

const hasData = computed(() => (props.items?.length ?? 0) > 0)

const tableWrap = ref<HTMLDivElement | null>(null)

onMounted(() => {
  const el = tableWrap.value
  if (!el) return

  const clampScroll = (delta: number) => {
    const max = el.scrollHeight - el.clientHeight
    const next = el.scrollTop + delta
    if (next < 0) {
      el.scrollTop = 0
      return true
    } else if (next > max) {
      el.scrollTop = max
      return true
    }
    return false
  }

  // Wheel handler
  el.addEventListener('wheel', (e: WheelEvent) => {
    if (clampScroll(e.deltaY)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, { passive: false })

  // Touch handler
  let startY = 0
  el.addEventListener('touchstart', (e: TouchEvent) => {
    startY = e.touches[0].clientY
  }, { passive: true })

  el.addEventListener('touchmove', (e: TouchEvent) => {
    const currentY = e.touches[0].clientY
    const deltaY = startY - currentY
    if (clampScroll(deltaY)) {
      e.preventDefault()
      e.stopPropagation()
    } else {
      startY = currentY // update khi kéo liên tục
    }
  }, { passive: false })
})

defineSlots<{
  header(): any
  row(props: { item: unknown; index: number }): any
  empty?(): any
}>()
</script>

<template>
  <div
      ref="tableWrap"
      class="table-scroll-wrap"
      :class="{ 'no-data': !hasData, 'is-loading': loading }"
      :style="{ maxHeight: typeof height === 'number' ? height + 'px' : height }"
  >
    <div v-if="loading" class="overlay">Loading…</div>

    <table class="table-scroll" :class="{ striped }">
      <thead :class="{ sticky: stickyHeader }">
      <tr>
        <slot name="header" />
      </tr>
      </thead>

      <tbody v-if="hasData">
      <tr v-for="(item, index) in items" :key="(item as any)?.id ?? index">
        <slot name="row" :item="item" :index="index" />
      </tr>
      </tbody>

      <tbody v-else>
      <tr>
        <td class="empty" :colspan="999">
          <slot name="empty">Không có dữ liệu</slot>
        </td>
      </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped lang="scss">

@use "@/assets/styles/elements";

.table-scroll-wrap {
  position: relative;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  overscroll-behavior: none;
  touch-action: pan-y;
}

.table-scroll {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: #fff;
}

.table-scroll thead { background: #f0f0f0; }
.table-scroll thead.sticky th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.table-scroll thead th {
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #374151;
  padding: 10px 12px;
}

.table-scroll tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid #f3f4f6;
  color: #111827;
  vertical-align: middle;
}

.table-scroll.striped tbody tr:nth-child(odd) td { background: #fcfcfd; }

.table-scroll td.empty {
  text-align: center;
  color: #6b7280;
  padding: 24px 12px;
}


.table-scroll-wrap {
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  overflow: auto;
  @include elements.scrollbar-hidden;
  width: 100%;
  max-height: calc(3*(40px) + 3*(30px - 6px));

  position: relative;   // cho sticky có containing block ổn

  border-bottom: var(--table-border);
}

.table-scroll {
  border-spacing: 0;
  border-collapse: separate;
  table-layout: fixed;
  gap: 0;
  padding: 0;
  width: 100%;
  text-align: left;

  th, td {
    border-bottom: 1px solid #666666;
    border-left: 1px solid #666666;
    padding: 10px;
    height: 40px;
    vertical-align: middle;
    overflow: hidden;
  }

  th {
    border-top: 1px solid #666666;
    background-color: var(--table-header-bg-color);
    position: sticky;
    top: 0;
  }

  tr td:last-child, tr th:last-child {
    border-right: 1px solid #666666;
  }

  tr:last-child td {
    border-bottom: none !important;
  }

  .text-value {
    display: flex;
    align-items: center;
    height: 30px;
  }

  .cell-icon {
    padding: 0px;
  }

  .icon-action-wrap {
    display: flex;
    justify-content: center;
  }

  .icon-action {
    width: 30px !important; /* Cố định kích thước */
    height: 30px !important;
    min-width: 30px; /* Ngăn co nhỏ */
    min-height: 30px;

    fill: var(--icon-bg-color);

    &:hover {
      fill: var(--icon-bg-color-active);
    }
  }
}

/* Bảng */
.table-scroll {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
}

/* Sticky header */
.table-scroll th {
  position: sticky;
  top: 0;
  z-index: 2;                 // để che body
  background: var(--table-header-bg-color);
  /* nên có background để không “trong suốt” khi đè lên rows */
}

/* Tránh cắt hàng cuối khi đụng đáy container */
.table-scroll tbody tr:last-child td {
  /* nếu bị “dính” đáy, thêm khoảng đệm 1 chút: */
  /* padding-bottom: 1px; hoặc giữ border-bottom thay vì none */
  border-bottom: 1px solid #666666; // đừng bỏ hẳn border-bottom
}

.env-variable-table {
  table-layout: fixed;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  %env-variable-table-cell {
    border-left: var(--table-border);
    border-bottom: var(--table-border);
    padding: 8px;
    vertical-align: middle;
    justify-content: center;
    max-height: 48px;
    min-height: 48px;
  }

  th {
    @extend %env-variable-table-cell;
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--table-header-bg-color);
    border-top: var(--table-border);
  }

  tr th:last-child, td:last-child {
    border-right: var(--table-border);
    padding: 2px 2px;
  }

  td {
    @extend %env-variable-table-cell
  }

  tr:last-child {
    td {
      border-bottom: none;
    }
  }
}

.cell-icon-action {
  display: flex;
  justify-content: center; // nếu muốn icon ở giữa
  width: 100%; // hoặc kích thước phù hợp bạn mong muốn
  height: 100%;
  padding: 0;
}

.icon-button-add-row {
  width: 30px !important;
  height: 30px;
  cursor: pointer;
  transition: fill 0.2s ease;

  &:hover {
    fill: #cccccc;
  }
}

.icon-button {
  cursor: pointer;
  transition: fill 0.2s ease;
  fill: var(--icon-bg-color);

  &:hover {
    fill: var(--icon-bg-color-active);
  }
}
</style>
