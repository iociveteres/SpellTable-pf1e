import { colIndex, divideChecked } from './utils.js';

function compareGeneric(a, b) {
    // return -1/0/1 based on what you "know" a and b
    // are here. Numbers, text, some custom case-insensitive
    // and natural number ordering, etc. That's up to you.
    // A typical "do whatever JS would do" is:
    return (a.textContent<b.textContent) ? -1 : (a.textContent>b.textContent) ? 1 : 0;
    //return (a<b) ? -1 : (a>b) ? 1 : 0;
  }

function compareTime(time1, time2) {
    return Number(time1.getAttribute("data-sort")) - Number(time2.getAttribute("data-sort"))
}

function compareRange(range1, range2) {
    if (range1.getAttribute("data-sort-dist") !== "null" && range2.getAttribute("data-sort-dist") !== "null") {
        return Number(range1.getAttribute("data-sort-dist")) - Number(range2.getAttribute("data-sort-dist"))
    } else {
        return Number(range1.getAttribute("data-sort-code")) - Number(range2.getAttribute("data-sort-code"))
    }
}

function compareDuration(dur1, dur2) {
    return Number(dur1.getAttribute("data-sort")) - Number(dur2.getAttribute("data-sort"))
}

  
function sortTable(table, colnum, direction) {
    console.time('sort')
    let compareFunc;
    switch (colnum + 1) {
        case colIndex.get("Casting Time"):
            compareFunc = compareTime
            break
        case colIndex.get("Range"):
            compareFunc = compareRange
            break
        case colIndex.get("Duration"):
            compareFunc = compareDuration
            break
        default:
            compareFunc = compareGeneric
    }
    // get all the rows in this table:
    let rows = Array.from(table.querySelectorAll(`tr`));
  
    // but ignore the heading row:
    rows = rows.slice(1);

    // only unchecked rows need sorting
    let {checkedRows, uncheckedRows} = divideChecked(rows);

    // set up the queryselector for getting the indicated
    // column from a row, so we can compare using its value:
    let qs = `td:nth-child(${colnum + 1})`;
  
    let d = direction == "asc" ? -1 : 1;
    // and then just... sort the rows:
    uncheckedRows.sort( (r1,r2) => {
        // get each row's relevant column
        let t1 = r1.querySelector(qs);
        let t2 = r2.querySelector(qs);
    
        // and then effect sorting by comparing their content:
        return d * compareFunc(t1, t2); 
      });

    // and then the magic part that makes the sorting appear on-page:
    // append checked rows first
    checkedRows.forEach(row => table.appendChild(row));

    // append sorted unchecked rows
    uncheckedRows.forEach(row => table.appendChild(row));
    console.timeEnd('sort')

    return direction == "asc" ? "desc" : "asc";
}

export {
    sortTable
}
