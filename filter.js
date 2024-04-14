import './logipar.js';

const lp = new window.Logipar();
lp.overwrite(Token.AND, '&');
lp.overwrite(Token.OR, '|');
lp.overwrite(Token.XOR, '^');
lp.overwrite(Token.NOT, '!');

const lastGoodFilters = new Map();
const compRegex = new RegExp(/[=<>]/);

function filterTable(table, colnum, filters) {
    console.debug('filter: ' + (filters))
    console.time('filter')
    // get all the rows in this table:
    let rows = Array.from(table.querySelectorAll(`tr`));
  
    // but ignore the heading row:
    rows = rows.slice(1);
    
    // hide all rows
    rows.forEach(row => row.style.display = "none");
    let result = rows;

    // iteratively filter out rows 
    filters.forEach((filter, position) => {
        // filter if string is not empty
        if (filter) {
            // for convinience replace "wizard" with "sorcere/wizard", etc
            let improvedFilter;
            if (position == 5)
                improvedFilter = replacePartialWays(filter);
            else
                improvedFilter = filter;

            // if expression throws exception when parsed use last saved for this col
            try {
                lp.parse(improvedFilter);
                lastGoodFilters.set(position, improvedFilter)               
            } catch (error) {
                lp.parse(lastGoodFilters.get(position));
            }

            // use created filter to filter respective column
            let qs = `td:nth-child(${position + 1})`;
            let f = lp.filterFunction((row, value) => {
                    let t = row.querySelector(qs).innerText;
                    if (position == 5) {
                        // split access ways and search every part for starting with logic tree node
                        // needed because antipaladin has paladin as a substring
                        let arr = t.toLowerCase().split("\n");
                        let foundElement = null;
                        if (arr.some((item, index) => {
                            foundElement = { item, index };
                            if (item.startsWith(value.toLowerCase())) {
                            //     if (compRegex.test(filter)) {
                            //         let operators = ['=', '<', '>']
                            //     }
                                return true;
                            }
                        }))
                        return true;                                             
                    } else {
                        if (t.toLowerCase().includes(value.toLowerCase()))
                            return true;
                    }
                    
                    // this works slower than split+some
                    // let index = 0;
                    // while (index < t.length) {
                    //     if (t.startsWith(value.toLowerCase(), index)) 
                    //         return true;
                    //     index = t.indexOf('\n', index) + 1
                    //     if (index == 0) 
                    //         break;
                    // }
                    return false;
            });
            
            result = result.filter(f); 
            console.debug(lp.stringify());
        }
    });

    // show again rows matching all filters
    result.forEach(row => row.style.display = "table-row");
    console.timeEnd('filter')
}


function parseFilterRaw(input) {
    let result = [];
    let currentSubstring = '';
    for (let i = 0; i < input.length; i++) {
        if (input[i] === '|') {
            if (currentSubstring !== '') {
                result.push(currentSubstring.trim());
                currentSubstring = '';
            }
        } else {
            currentSubstring += input[i];
        }
    }
    if (currentSubstring !== '') {
        result.push(currentSubstring.trim());
    }

    return result;
}


function replacePartialWays(string) {
    let result = string.replace(/wizard|sorcerer/g, "sorcerer/wizard");
    result = result.replace(/cleric|oracle/g, "cleric/oracle");
    return result;
}


function constructOrFilterRegex(strings) {
    let regexString = `\\b(?:`;
    strings.forEach((str, idx, array) => {
        regexString += str + "\\w*";
        if (idx !== array.length - 1) {
            regexString += "|";
        }
    });
    regexString += `)\\b`;
    regexString = replacePartialWays(regexString);
    return regexString;
}


export {
    filterTable
}
