import Suggestion from '@tiptap/suggestion'
import slashCommandSuggestion from './slashCommandSuggestion'

export default Suggestion({
    char: '/',
    startOfLine: false,
    allowSpaces: true,
    suggestion: slashCommandSuggestion,
})
