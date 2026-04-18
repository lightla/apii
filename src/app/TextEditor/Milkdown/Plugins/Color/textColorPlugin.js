// src/app/TextEditor/Milkdown/Plugins/Color/textColorPlugin.js
import { $mark, $view } from '@milkdown/utils';

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

// Tạo color picker đơn giản
export const textColorPlugin = $view(() => {
    return (ctx) => {
        const button = document.createElement('button');
        button.className = 'text-color-btn';
        button.innerHTML = '🎨';
        button.title = 'Text Color';

        button.onclick = (e) => {
            e.preventDefault();
            const input = document.createElement('input');
            input.type = 'color';
            input.onchange = (e) => {
                const color = e.target.value;
                const command = (state, dispatch) => {
                    const { from, to } = state.selection;
                    if (from !== to && dispatch) {
                        const mark = state.schema.marks.textColor.create({ color });
                        dispatch(state.tr.addMark(from, to, mark));
                    }
                    return true;
                };
                ctx.editor.action(command);
            };
            input.click();
        };

        return {
            dom: button,
            destroy: () => {}
        };
    };
});

// Export đúng tên hàm
export const createTextColorCommand = (color) => {
    return (state, dispatch) => {
        const { from, to } = state.selection;
        if (from !== to && dispatch) {
            const mark = state.schema.marks.textColor.create({ color });
            dispatch(state.tr.addMark(from, to, mark));
        }
        return true;
    };
};