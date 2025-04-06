import {
    colIndex, divideChecked,
    showRowsSorting, hideRowsSorting,
    divideFilteredOut, rowsReveal,
    insertCheckedRows, extractSortParts,
    replacePartialWays
} from './utils.js';

function compareGeneric(a, b) {
    // return -1/0/1 based on what you "know" a and b
    // are here. Numbers, text, some custom case-insensitive
    // and natural number ordering, etc. That's up to you.
    // A typical "do whatever JS would do" is:
    return (a.textContent < b.textContent) ? -1 : (a.textContent > b.textContent) ? 1 : 0;
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

function compareAccessWays(ways1, ways2) {
    return Number(ways1.getAttribute("data-minlvl")) - Number(ways2.getAttribute("data-minlvl"))
}

// Module-level cache that persists across comparator function instances.
const accessWaysCache = new WeakMap();

// Shared function to get (or compute) the parsed access ways for a given cell.
function getParsedWays(td) {
  if (!accessWaysCache.has(td)) {
    const parsed = parseAccessWays(td.innerText.toLowerCase().split("\n"));
    accessWaysCache.set(td, parsed);
  }
  return accessWaysCache.get(td);
}

function makeAccessWaysComparator(sortPart, filterPart) {
  function compareFor(td1, td2, part) {
    const parsed1 = getParsedWays(td1);
    const parsed2 = getParsedWays(td2);
    const value1 = parsed1[part] ?? null;
    const value2 = parsed2[part] ?? null;

    // Explicitly compare even if values are 0.
    if (value1 !== null && value2 !== null) return value1 - value2;
    if (value1 !== null && value2 === null) return -1;
    if (value1 === null && value2 !== null) return 1;
    return 0;
  }

  return function(t1, t2) {
    if (sortPart) {
      const cmp = compareFor(t1, t2, sortPart);
      if (cmp !== 0) return cmp;
    }

    if (filterPart) {
      const cmp = compareFor(t1, t2, filterPart);
      if (cmp !== 0) return cmp;
    }
    
    return compareAccessWays(t1, t2);
  };
}

function sortTable(table, colnum, direction, filters) {
    console.time('sort')
    // get all the rows in this table:
    let tbody = table.querySelector("tbody");

    // it would be better to divide checked and unchecked rows first
    // but it works this way and is easier, because checked rows are visible
    let { visibleRows, _ } = divideFilteredOut(tbody);
    let sortableRows = Array.from(visibleRows);

    let { checkedRows, checkedDescs, uncheckedRows } = divideChecked(sortableRows);
    uncheckedRows.forEach(row => showRowsSorting(row));

    // set up the queryselector for getting the indicated
    // column from a row, so we can compare using its value:
    let qs = `td:nth-child(${colnum + 1})`;

    let compareFunc;
    switch (colnum + 1) {
        case colIndex.get("Access Ways"):
            let filter = filters[colIndex.get("Access Ways") - 2].toLowerCase();
            let [sortPart, filterPart] = extractSortParts(filter)
            if (sortPart) {
                sortPart = replacePartialWays(sortPart);
            }
            if (/[&|^]/.test(filterPart)) {
                filterPart = null;
            } else {
                filterPart = filterPart.trim().split(/[ <>=]+/)[0];
                filterPart = replacePartialWays(filterPart)
            }
            compareFunc = (sortPart || filterPart)
                ? makeAccessWaysComparator(sortPart, filterPart)
                : compareAccessWays;
            break
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

    let d = direction == "asc" ? -1 : 1;
    // and then just... sort the rows:
    uncheckedRows.sort((r1, r2) => {
        // get each row's relevant column
        let t1 = r1.querySelector(qs);
        let t2 = r2.querySelector(qs);

        // and then effect sorting by comparing their content:
        return d * compareFunc(t1, t2);
    });

    checkedRows.sort((r1, r2) => {
        let t1 = r1.querySelector(qs);
        let t2 = r2.querySelector(qs);

        return d * compareFunc(t1, t2);
    });

    // and then the magic part that makes the sorting appear on-page:
    // append checked rows first
    insertCheckedRows(tbody, checkedRows, checkedDescs);

    // append sorted unchecked rows
    let visibleCount = 0;
    for (let i = 0; i < uncheckedRows.length; i++) {
        let row = uncheckedRows[i];
        // I tried to avoid 
        if (visibleCount < rowsReveal && !row.classList.contains('hidden-on-filter'))
            visibleCount++;
        else
            hideRowsSorting(row);
        tbody.appendChild(row);
    }
    console.timeEnd('sort')

    return direction == "asc" ? "desc" : "asc";
}

const splitOnNumberRegex = new RegExp(/\s+(\d+)$/);
function parseAccessWays(arr) {
    return arr
        .reduce((acc, line) => {
            let [key, value] = line.split(splitOnNumberRegex); // split on last number
            if (key && value !== undefined) {
                acc[key.trim()] = Number(value);
            }
            return acc;
        }, {});
}

export {
    sortTable
}
