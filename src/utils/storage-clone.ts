export function cloneRequestData(sourceId: string, targetId: string) {
  const keys = [
    `api_request_data_${sourceId}`,
    `request_info_note_quill_${sourceId}`,
    `request_info_search_fields_${sourceId}`,
    `tags_${sourceId}`
  ]

  keys.forEach(key => {
    const data = localStorage.getItem(key)
    if (data !== null) {
      const targetKey = key.replace(sourceId, targetId)
      localStorage.setItem(targetKey, data)
    }
  })
}

export function deleteRequestData(id: string) {
  const keys = [
    `api_request_data_${id}`,
    `request_info_note_quill_${id}`,
    `request_info_search_fields_${id}`,
    `tags_${id}`
  ]
  keys.forEach(key => localStorage.removeItem(key))
}
