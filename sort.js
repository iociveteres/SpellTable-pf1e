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
  
function sortTable(table, colnum, direction) {
    console.time('sort')
    let compareFunc;
    switch (colnum) {
        case 5:
            compareFunc = compareTime
            break
        default:
            compareFunc = compareGeneric
    }
    // get all the rows in this table:
    let rows = Array.from(table.querySelectorAll(`tr`));
  
    // but ignore the heading row:
    rows = rows.slice(1);
  
    // set up the queryselector for getting the indicated
    // column from a row, so we can compare using its value:
    let qs = `td:nth-child(${colnum + 1})`;
  
    let d = direction == "asc" ? -1 : 1;
    // and then just... sort the rows:
    rows.sort( (r1,r2) => {
        // get each row's relevant column
        let t1 = r1.querySelector(qs);
        let t2 = r2.querySelector(qs);
    
        // and then effect sorting by comparing their content:
        return d * compareFunc(t1, t2); // I changed it to 
      });

    // and then the magic part that makes the sorting appear on-page:
    rows.forEach(row => table.appendChild(row));
    console.timeEnd('sort')

    return direction == "asc" ? "desc" : "asc";
}

export {
    sortTable
}

