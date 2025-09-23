// src/extensions/SlashCommand.js
import { Extension } from '@tiptap/core'
import { Plugin } from 'prosemirror-state'

export const SlashCommand = Extension.create({
    name: 'slash-command',

    addOptions() {
        return {
            onSlash: null,
        }
    },

    addProseMirrorPlugins() {
        return [
            new Plugin({
                props: {
                    handleTextInput: (view, from, to, text) => {
                        if (text === '/') {
                            this.options.onSlash?.()
                        }
                        return false
                    },
                },
            }),
        ]
    },
})