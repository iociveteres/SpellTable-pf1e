let thElements = Array.from(document.getElementById('table_spells').querySelectorAll('th'));
export const colIndex = new Map();

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
