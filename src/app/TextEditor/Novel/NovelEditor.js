import {
    EditorBubble,
    EditorBubbleItem,
    EditorCommand,
    EditorCommandItem,
    EditorContent,
    EditorRoot,
} from "novel";

export default () => (
    <EditorRoot>
        <EditorContent>
            <EditorCommand>
                <EditorCommandItem  onCommand={}/>
                <EditorCommandItem  onCommand={}/>
                <EditorCommandItem  onCommand={}/>
            </EditorCommand>
            <EditorBubble>
                <EditorBubbleItem  children={}/>
                <EditorBubbleItem  children={}/>
                <EditorBubbleItem  children={}/>
            </EditorBubble>
        </EditorContent>
    </EditorRoot>
);