import { reactive } from 'vue'

function createPipelineManager(initialData: any[], steps: string[]) {
    const items = reactive<Record<string, any[]>>({})

    // Gán dữ liệu đầu vào cho bước đầu tiên
    items[steps[0]] = initialData

    // Khởi tạo các bước còn lại là mảng rỗng
    for (let i = 1; i < steps.length; i++) {
        items[steps[i]] = items[steps[i - 1]]
    }

    const lastItems = items[steps.length - 1]

    return {
        items,
        lastItems,
    }
}

export { createPipelineManager }