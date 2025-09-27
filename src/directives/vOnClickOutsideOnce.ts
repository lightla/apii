export const vOnClickOutsideOnce = {
    mounted(el: HTMLElement, binding: DirectiveBinding) {
        const element = el as HTMLElement & {
            __clickOutsideHandler__?: (event: MouseEvent) => void
        }

        const handler = (event: MouseEvent) => {
            if (!(el === event.target || el.contains(event.target as Node))) {
                binding.value(event) // gọi callback
            }
        }

        element.__clickOutsideHandler__ = handler
        document.addEventListener('click', handler)
    },

    unmounted(el: HTMLElement) {
        const element = el as HTMLElement & {
            __clickOutsideHandler__?: (event: MouseEvent) => void
        }

        if (element.__clickOutsideHandler__) {
            document.removeEventListener('click', element.__clickOutsideHandler__)
        }
    }
}