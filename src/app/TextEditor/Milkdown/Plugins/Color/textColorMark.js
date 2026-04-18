// src/app/TextEditor/Milkdown/Plugins/Color/textColorPlugin.js
import { $mark } from '@milkdown/utils';

// Định nghĩa textColor mark
export const textColorMark = $mark('textColor', () => ({
    schema: {
        attrs: {
            color: { default: '#000000' }
        },
        parseDOM: [{
            style: 'color',
            getAttrs: (value) => ({ color: value })
        }],
        toDOM: (node) => ['span', { style: `color: ${node.attrs.color}` }, 0]
    }
}));

// Tạo command riêng
export const createTextColorCommand = () => {
    return (color) => {
        return (state, dispatch) => {
            const { from, to } = state.selection;
            if (from !== to && dispatch) {
                const mark = state.schema.marks.textColor.create({ color });
                dispatch(state.tr.addMark(from, to, mark));
            }
            return true;
        };
    };
};