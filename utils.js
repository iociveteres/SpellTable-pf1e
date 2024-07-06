export const colIndex = new Map();
let thElements = Array.from(document.getElementById('table-spells').querySelectorAll('th'));
thElements.forEach((th, index) => {
    const innerText = th.innerText.trim();
    colIndex.set(innerText, index + 1);
});

export function divideChecked(rows) {
    let checkedRows = [];
    let uncheckedRows = [];
    let prevRowChecked = false;
    rows.forEach(row => {
        let checkbox = row.querySelector('td:first-child input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
            checkedRows.push(row);
            prevRowChecked = true;
        } else if (prevRowChecked && (row.classList.contains('show-row') || row.classList.contains('hidden-row'))) {
            checkedRows.push(row);
            prevRowChecked = false;
        } else {
            uncheckedRows.push(row);
            prevRowChecked = false;
        }
    });

    return {checkedRows: checkedRows, uncheckedRows: uncheckedRows};
}

export const rowsReveal = 100;

export function hideRowsFiltering(row) {
    row.classList.add('hidden-on-filter');
    row.classList.remove('displayed')
    row.classList.remove('hidden-on-scroll')
}

export function showRowsFiltering(row, position) {
    row.classList.remove('hidden-on-filter');
    if (position >= rowsReveal) {
        row.classList.add('hidden-on-scroll')
    } else {
        row.classList.add('displayed')
    }
}

export function showRowsScrolling(row) {
    if (row.classList.contains('data-row')) {
        row.classList.remove('hidden-on-scroll')
        row.classList.add('displayed')
    }
}

export function showRowsSorting(row) {
    if (row.classList.contains('data-row') &&
        !row.classList.contains('hidden-on-filter')) {
        row.classList.remove('hidden-on-scroll')
        row.classList.add('displayed')
    }
}

export function hideRowsSorting(row, position) {
    if (position >= rowsReveal) {
        row.classList.remove('displayed')
        row.classList.add('hidden-on-scroll')
    }
}

export const timeUnits = new Map([
    ["free action", 1], 
    ["immediate action", 2], 
    ["swift action", 3], 
    ["move action", 4], 
    ["standard action", 5],
    ["full-round action", 6], 
    ["full round", 7], 
    ["round", 8], 
    ["minute", 9], 
    ["hour", 10], 
    ["day", 11], 
    ["week", 12],
    ["see", 13],
    ["special", 14]
]);

export const rangeUnits = new Map([
    ["personal", 0], 
    ["touch", 1], 
    ["close", 2], 
    ["medium", 3], 
    ["long", 4],
    ["ft.", 5], 
    ["feet", 5], 
    ["mile", 6], 
    ["hex", 7], 
    ["unlimited", 8], 
    ["see text", 9],
    ["", 10]
]);

export const durationUnits = new Map([
    ["instantaneous", 0], 
    ["concentration", 1], 
    [" round/level", 2], 
    [" round", 3], 
    [" minute/level", 4], 
    [" min./level", 4], 
    [" minute", 5], 
    [" minutes/level", 6], 
    [" min./level", 6], 
    [" minutes", 7], 
    [" hour/level", 8],
    [" hour", 9], 
    [" day/level", 10], 
    [" day", 11], 
    [" week/level", 12], 
    [" week", 13], 
    [" month", 14], 
    [" battle", 15], 
    ["until triggered", 16],
    ["permanent", 17], 
    ["see", 18],
    ["special", 19]
]);
