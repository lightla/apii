import { Extension } from '@tiptap/core'

export default Extension.create({
  name: 'draggable',
  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'blockquote'],
        attributes: {
          draggable: { default: true },
        },
      },
    ]
  },
})
