
const filterSearch = (
    items: any[],
    searchField: string,
    containValue: string
): any[] => {
    if (!items || !searchField || !containValue) return [];

    return items.filter(item => {
        const fieldValue = item[searchField];
        if (typeof fieldValue !== 'string') return false;

        return fieldValue.toLowerCase().includes(containValue.toLowerCase());
    });
}

export { filterSearch }

