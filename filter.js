function filterTable(table, colnum, filters) {
    console.time('filter')
    // get all the rows in this table:
    let rows = Array.from(table.querySelectorAll(`tr`));
  
    // but ignore the heading row:
    rows = rows.slice(1);
    
    // set up the queryselector for getting the indicated
    // column from a row, so we can compare using its value:
    rows.forEach(row => row.style.display = "none");
    let result = rows;

    filters.forEach((filter, position) => {
        if (filter) {
            const regex = new RegExp(filter, 'i')
            let qs = `td:nth-child(${position + 1})`;
            result = result.filter( (r) => {
                let t = r.querySelector(qs);
                let a = regex.test(t.innerText)
                return a
            });
        }
    });

    result.forEach(row => row.style.display = "table-row");
    console.timeEnd('filter')
    //return direction == "asc" ? "desc" : "asc";
}

export {
    filterTable
}
