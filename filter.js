import './logipar.js';
import { colIndex, divideChecked } from './utils.js';

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
    
    // only unchecked rows need filtering
    let {checkedRows, uncheckedRows} = divideChecked(rows);

    // hide all rows
    uncheckedRows.forEach(row => row.style.display = "none");
    let result = uncheckedRows;

    // iteratively filter out rows 
    filters.forEach((filter, position) => {
        // filter if string is not empty
        if (filter) {
            // for convinience replace "wizard" with "sorcere/wizard", etc
            let improvedFilter;
            switch (position + 2) { // +1 is from Pin without input, +1 because array index starts from 0, really dislike it
                case colIndex.get("Access ways"):
                    improvedFilter = replacePartialWays(filter);
                    break
                default:
                    improvedFilter = filter;
            }              

            // if expression throws exception when parsed use last saved for this col
            try {
                lp.parse(improvedFilter);
                lastGoodFilters.set(position, improvedFilter)               
            } catch (error) {
                lp.parse(lastGoodFilters.get(position));
            }

            // use created filter to filter respective column
            let qs = `td:nth-child(${position + 2})`;
            let f = lp.filterFunction((row, filter) => {
                    let t = row.querySelector(qs).innerText;
                    if (position + 2 == colIndex.get("Access ways")) {
                        if (filterAccessWays(t, filter))
                            return true;
                    } else {
                        if (t.toLowerCase().includes(filter.toLowerCase()))
                            return true;
                    }
                
                    return false;
            });
            
            result = result.filter(f); 
            console.debug(lp.stringify());
        }
    });
    // append checked rows first
    checkedRows.forEach(row => table.appendChild(row));
    // show again rows matching all filters
    result.forEach(row => {
        row.style.display = "table-row";
        table.appendChild(row);
    });
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


function filterAccessWays(innerText, filter) {
    // split access ways and search every part for starting with logic tree node
    // needed because antipaladin has paladin as a substring
    let lookforClassLevel = (item, index) => {
        //foundElement = { item, index };
        if (item.startsWith(filter.toLowerCase())) {
        //     if (compRegex.test(filter)) {
        //         let operators = ['=', '<', '>']
        //     }
            return true;
        }
    };

    let lookforLevel = (item, index) => {
        if (item.includes(filter.toLowerCase())) {
            return true;
        }
    };

    let lookforFunc;
    let digitRegex = /^\d+$/;
    if (digitRegex.test(filter)) 
        lookforFunc = lookforLevel;
    else
        lookforFunc = lookforClassLevel;

    let arr = innerText.toLowerCase().split("\n");
    //let foundElement = null;
    let foundSomeShit = arr.some(lookforFunc);

    return foundSomeShit; 
}



export {
    filterTable
}
