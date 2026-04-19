import { HighlightVariableTypeEnum } from "@/types";
import type { HighlightVariableParam } from "@/types";

/*******************
 * PUBLIC
 *******************/

export const replaceInputTextContent = (target: HTMLDivElement) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const offset = getCaretCharacterOffsetWithin(target);
    target.textContent = target.textContent || "";
    setCurrentCursorOffset(target, offset);
}

export const highlightEnvVariable = (target: HTMLDivElement, withCursor: boolean = false) => {
    const offset = withCursor ? getCaretCharacterOffsetWithin(target) : 0;
    const text = target.textContent || "";
    const html = text.replace(/^{{[^{}\s]+}}$/, (match) => `<span class="defined-env-variable">${match}</span>`);
    if (target.innerHTML !== html) {
        target.innerHTML = html;
        if (withCursor) setCurrentCursorOffset(target, offset);
    }
}

// Lưu vết trạng thái biến để chống reset DOM vô ích
const lastSegmentsMap = new WeakMap<HTMLElement, string>();

/**
 * GIẢI PHÁP CHỐNG RESET CURSOR: TRUY VẾT CHARACTER OFFSET + SIGNATURE ABORT
 */
export const replaceHighlightVariables = (param: HighlightVariableParam) => {
    const definedEnvVariables = param.options?.definedEnvVariables ?? []
    const rawText = param.target.textContent || '';
    const text = rawText.replace(/\u00A0/g, ' '); // Chuẩn hóa dấu cách trình duyệt

    const regexMap = {
        [HighlightVariableTypeEnum.EnvVariable]: /{{[^{}\s]+}}/g,
        [HighlightVariableTypeEnum.UriParam]: /(?<!{){[^{}\s]+}(?!})/g
    };

    // 1. Phân tích các phân đoạn biến
    const matches: {start: number, end: number, cls: string, text: string}[] = [];
    param.variables.forEach(variable => {
        const regex = new RegExp(regexMap[variable.type].source, 'g');
        let m;
        while ((m = regex.exec(text)) !== null) {
            let cls = variable.definedVariableCssClass;
            if (variable.type === HighlightVariableTypeEnum.EnvVariable) {
                cls = definedEnvVariables.includes(m[0]) ? cls : (variable.undefinedEnvVariableCssClass ?? cls);
            }
            matches.push({ start: m.index, end: m.index + m[0].length, cls, text: m[0] });
        }
    });

    // 2. TẠO SIGNATURE: Chỉ thay đổi DOM khi số lượng hoặc vị trí biến thay đổi
    matches.sort((a, b) => a.start - b.start);
    const signature = matches.map(m => `${m.start}-${m.end}-${m.cls}`).join('|');
    
    // Nếu signature giống hệt và DOM đã có màu, CHẶN CẬP NHẬT để bảo vệ con trỏ native
    if (lastSegmentsMap.get(param.target) === signature && param.target.querySelector('span')) {
        return;
    }
    lastSegmentsMap.set(param.target, signature);

    // 3. Nếu cần cập nhật, lưu con trỏ Character Offset
    const sel = window.getSelection();
    let savedOffset = -1;
    if (param.withCursor && sel && sel.rangeCount > 0 && param.target.contains(sel.getRangeAt(0).startContainer)) {
        savedOffset = getCaretCharacterOffsetWithin(param.target);
    }

    // 4. Xây dựng HTML mới
    let finalHTML = "";
    let lastIndex = 0;
    matches.forEach(m => {
        finalHTML += escapeHtml(text.substring(lastIndex, m.start));
        finalHTML += `<span class="${m.cls}">${escapeHtml(m.text)}</span>`;
        lastIndex = m.end;
    });
    finalHTML += escapeHtml(text.substring(lastIndex));
    if (finalHTML === "") finalHTML = "<br>";

    // 5. Cập nhật DOM
    const temp = document.createElement('div');
    temp.innerHTML = finalHTML;
    if (param.target.innerHTML !== temp.innerHTML) {
        param.target.innerHTML = temp.innerHTML;
        if (savedOffset !== -1) {
            setCurrentCursorOffset(param.target, savedOffset);
        }
    }
}

/*******************
 * PRIVATE UTILS
 *******************/

function getCaretCharacterOffsetWithin(element: HTMLElement): number {
    let caretOffset = 0;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
}

function setCurrentCursorOffset(element: HTMLElement, offset: number) {
    const sel = window.getSelection();
    if (!sel) return;

    let charCount = 0;
    const range = document.createRange();
    const nodeStack: Node[] = [element];
    let node: Node | undefined;
    let found = false;

    while (!found && (node = nodeStack.pop())) {
        if (node.nodeType === Node.TEXT_NODE) {
            const nextCharCount = charCount + (node.textContent?.length || 0);
            if (offset <= nextCharCount) {
                range.setStart(node, offset - charCount);
                range.collapse(true);
                found = true;
            }
            charCount = nextCharCount;
        } else {
            let i = node.childNodes.length;
            while (i--) nodeStack.push(node.childNodes[i]);
        }
    }

    if (found) {
        sel.removeAllRanges();
        sel.addRange(range);
    } else {
        const lastText = findLastTextNode(element);
        if (lastText) {
            range.setStart(lastText, lastText.textContent?.length || 0);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}

function findLastTextNode(node: Node): Node | null {
    if (node.nodeType === Node.TEXT_NODE) return node;
    for (let i = node.childNodes.length - 1; i >= 0; i--) {
        const found = findLastTextNode(node.childNodes[i]);
        if (found) return found;
    }
    return null;
}

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
