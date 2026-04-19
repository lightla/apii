import { HighlightVariableTypeEnum } from "@/types";
import type { HighlightVariableParam } from "@/types";

/*******************
 * PUBLIC
 *******************/

export const replaceInputTextContent = (target: HTMLDivElement) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const offset = getCaretCharacterOffsetWithin(target);
    
    // Khi set textContent, trình duyệt sẽ tự xóa hết span và br
    target.textContent = target.textContent || "";
    
    // Nếu rỗng sau khi xóa, thêm lại br để giữ cursor
    if (target.textContent === "") {
        target.innerHTML = "<br>";
    }

    setCurrentCursorOffset(target, offset);
}

export const highlightEnvVariable = (target: HTMLDivElement, withCursor: boolean = false) => {
    const offset = withCursor ? getCaretCharacterOffsetWithin(target) : 0;
    const text = target.textContent || "";
    const html = text.replace(/^{{[^{}\s]+}}$/, (match) => `<span class="defined-env-variable">${match}</span>`);
    
    if (target.innerHTML !== html) {
        target.innerHTML = html === "" ? "<br>" : html;
        if (withCursor) setCurrentCursorOffset(target, offset);
    }
}

/**
 * GIẢI PHÁP TỐI THƯỢNG: NODE DIFFING HIGHLIGHTER
 */
export const replaceHighlightVariables = (param: HighlightVariableParam) => {
    const definedEnvVariables = param.options?.definedEnvVariables ?? []
    const text = (param.target.textContent || '').replace(/\u00A0/g, ' ');
    
    // 1. Phân tích các đoạn cần highlight (Segments)
    const segments = parseSegments(text, param.variables, definedEnvVariables);
    
    // 2. Cập nhật DOM một cách "phẫu thuật"
    patchDOM(param.target, segments);
}

/*******************
 * PHÂN TÍCH VĂN BẢN THÀNH CÁC ĐOẠN (SEGMENTS)
 *******************/
interface Segment {
    text: string;
    isVar: boolean;
    cls?: string;
}

function parseSegments(text: string, variableTypes: any[], definedVars: string[]): Segment[] {
    const regexMap: any = {
        [HighlightVariableTypeEnum.EnvVariable]: /{{[^{}\s]+}}/g,
        [HighlightVariableTypeEnum.UriParam]: /(?<!{){[^{}\s]+}(?!})/g
    };

    let matches: {start: number, end: number, cls: string}[] = [];
    variableTypes.forEach(vt => {
        const regex = new RegExp(regexMap[vt.type].source, 'g');
        let m;
        while ((m = regex.exec(text)) !== null) {
            let cls = vt.definedVariableCssClass;
            if (vt.type === HighlightVariableTypeEnum.EnvVariable) {
                cls = definedVars.includes(m[0]) ? cls : (vt.undefinedEnvVariableCssClass ?? cls);
            }
            matches.push({ start: m.index, end: m.index + m[0].length, cls });
        }
    });

    matches.sort((a, b) => a.start - b.start);

    const segments: Segment[] = [];
    let lastIndex = 0;
    matches.forEach(m => {
        if (m.start > lastIndex) {
            segments.push({ text: text.substring(lastIndex, m.start), isVar: false });
        }
        segments.push({ text: text.substring(m.start, m.end), isVar: true, cls: m.cls });
        lastIndex = m.end;
    });
    if (lastIndex < text.length) {
        segments.push({ text: text.substring(lastIndex), isVar: false });
    }
    return segments;
}

/*******************
 * THUẬT TOÁN PATCH DOM: CHỈ THAY ĐỔI NHỮNG GÌ CẦN THIẾT
 *******************/
function patchDOM(container: HTMLElement, segments: Segment[]) {
    const sel = window.getSelection();
    let savedOffset = 0;
    let hasSelection = false;

    if (sel && sel.rangeCount > 0 && container.contains(sel.getRangeAt(0).startContainer)) {
        savedOffset = getCaretCharacterOffsetWithin(container);
        hasSelection = true;
    }

    const fragment = document.createDocumentFragment();
    segments.forEach(s => {
        if (s.isVar) {
            const span = document.createElement('span');
            span.className = s.cls || '';
            span.textContent = s.text;
            fragment.appendChild(span);
        } else if (s.text !== "") {
            fragment.appendChild(document.createTextNode(s.text));
        }
    });
    
    // "THE GHOST BR": Luôn giữ một thẻ br nếu trống để Chrome hiện cursor
    if (fragment.childNodes.length === 0) {
        fragment.appendChild(document.createElement('br'));
    }

    const temp = document.createElement('div');
    temp.appendChild(fragment.cloneNode(true));
    
    if (container.innerHTML !== temp.innerHTML) {
        container.innerHTML = temp.innerHTML;
        if (hasSelection) {
            setCurrentCursorOffset(container, savedOffset);
        }
    }
}

/*******************
 * TIỆN ÍCH CURSOR
 *******************/

function getCaretCharacterOffsetWithin(element: HTMLElement): number {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return 0;
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    return preCaretRange.toString().length;
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
        } else {
            // Trường hợp rỗng hoàn toàn (chỉ có <br>)
            range.setStart(element, 0);
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
