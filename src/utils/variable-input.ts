import { HighlightVariableTypeEnum } from "@/types";
import type { HighlightVariableParam } from "@/types";

/*******************
 * PUBLIC
 *******************/

export const replaceInputTextContent = (target: HTMLDivElement) => {
    const selection = window.getSelection()

    if (! selection || selection.rangeCount === 0) {
        return
    }

    const isTextContentEmpty = ! target.textContent?.trim();

    const textContent = ! isTextContentEmpty ? (target.textContent ?? '') : '';

    const range = selection.getRangeAt(0)
    const preCursorOffset = getTextOffset(target, range)

    target.textContent = textContent;
    target.innerHTML = textContent;

    setCursorAtTextOffset(target, preCursorOffset)
}

export const highlightEnvVariable = (
    target: HTMLDivElement,
    withCursor: boolean = false
) => {
    const cursor = {
        preCursorOffset: 0
    }

    if (withCursor) {
        const selection = window.getSelection()

        if (!selection || selection.rangeCount === 0) {
            return
        }

        const range = selection.getRangeAt(0)

        cursor.preCursorOffset = getTextOffset(target, range)
    }

    let highlightContent = target.textContent || '';

    target.innerHTML = highlightContent.replace(/^{{[^{}\s]+}}$/, (match) => {
        console.log("match:" + match)
        return `<span class="defined-env-variable">${match}</span>`
    })

    if (withCursor) {
        setCursorAtTextOffset(target, cursor.preCursorOffset)
    }
}

export const replaceHighlightVariables = (param: HighlightVariableParam) => {
    const definedEnvVariables = param.options?.definedEnvVariables ?? []
    const cursor = { preCursorOffset: 0 }

    if (param.withCursor) {
        const selection = window.getSelection()

        if (! selection || selection.rangeCount === 0) {
            return
        }

        const range = selection.getRangeAt(0)
        cursor.preCursorOffset = getTextOffset(param.target, range)
    }

    const regexMap = {
        [HighlightVariableTypeEnum.EnvVariable]: /{{[^{}\s]+}}/g,
        [HighlightVariableTypeEnum.UriParam]: /(?<!{){[^{}\s]+}(?!})/g
    };

    let highlightContent = param.target.textContent || '';

    param.variables.forEach(variable => {
        const regex = regexMap[variable.type] as RegExp;

        switch (variable.type) {
            case HighlightVariableTypeEnum.EnvVariable:
                highlightContent = highlightContent.replace(regex, (match) => {
                    const chosenColorClass = definedEnvVariables.find(variable => variable === match)
                        ? variable.definedVariableCssClass
                        : (variable.undefinedEnvVariableCssClass ?? variable.definedVariableCssClass)

                    return `<span class='${chosenColorClass}'>${match}</span>`
                });
                break;
            default:
                highlightContent = highlightContent.replace(regex, (match) => {
                    return `<span class='${variable.definedVariableCssClass}'>${match}</span>`
                });
        }
    });

    // Strip trailing <br> that browsers add to contenteditable before comparing
    const currentHTML = param.target.innerHTML.replace(/<br\s*\/?>\s*$/i, '');

    if (currentHTML !== highlightContent) {
        param.target.innerHTML = highlightContent;

        if (param.withCursor) {
            setCursorAtTextOffset(param.target, cursor.preCursorOffset)
        }
    }
}

/*******************
 * PRIVATE
 *******************/

const getTextOffset = (container: HTMLElement, range: Range): number => {
    const tempRange = range.cloneRange();
    tempRange.selectNodeContents(container);
    tempRange.setEnd(range.endContainer, range.endOffset);
    return tempRange.toString().length;
};

const setCursorAtTextOffset = (container: HTMLElement, offset: number) => {
    const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    let currentOffset = 0;

    while (treeWalker.nextNode()) {
        const node = treeWalker.currentNode;
        const nodeLength = node.textContent?.length || 0;

        if (currentOffset + nodeLength >= offset) {
            const sel = window.getSelection();
            const range = document.createRange();
            range.setStart(node, offset - currentOffset);
            range.collapse(true);
            sel?.removeAllRanges();
            sel?.addRange(range);
            return;
        }
        currentOffset += nodeLength;
    }
};