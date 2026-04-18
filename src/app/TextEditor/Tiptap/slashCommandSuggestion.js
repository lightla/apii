import { VueRenderer } from '@tiptap/vue-3'
import tippy from 'tippy.js'
import CommandList from './CommandList.vue'

export default {
    items: ({ query }) => {
        const all = [
            { title: 'Heading 1', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run() },
            { title: 'Heading 2', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run() },
            { title: 'Bullet List', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBulletList().run() },
            { title: 'Bold', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleBold().run() },
            { title: 'Italic', command: ({ editor, range }) => editor.chain().focus().deleteRange(range).toggleItalic().run() },
        ]
        return query ? all.filter(i => i.title.toLowerCase().includes(query.toLowerCase())) : all
    },

    render: () => {
        let component
        let popup

        return {
            onStart: props => {
                component = new VueRenderer(CommandList, { props, editor: props.editor })

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: component.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                })
            },
            onUpdate: props => {
                component.updateProps(props)
                popup.setProps({ getReferenceClientRect: props.clientRect })
            },
            onKeyDown: props => {
                if (props.event.key === 'Escape') {
                    popup.hide()
                    return true
                }
                return component.ref?.onKeyDown(props)
            },
            onExit: () => {
                popup.destroy()
                component.destroy()
            },
        }
    },
}
