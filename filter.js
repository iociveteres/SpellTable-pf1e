import './logipar.js';
import { colIndex, divideChecked, hideRowsFiltering, showRowsFiltering, 
         timeUnits, rangeUnits, durationUnits} from './utils.js';

const lp = new window.Logipar();
lp.overwrite(Token.AND, '&');
lp.overwrite(Token.OR, '|');
lp.overwrite(Token.XOR, '^');
lp.overwrite(Token.NOT, '!');

const lastGoodFilters = new Map();
const compRegex = new RegExp(/[=<>]/);
const digitRegex = new RegExp(/^[<>=]?\d+$/);

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
    uncheckedRows.forEach(row => hideRowsFiltering(row));
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
                    let t = row.querySelector(qs);
                    switch (position + 2) {
                        case colIndex.get("Access ways"): {
                            if (filterAccessWays(t, filter))
                                return true;
                            break;
                        }
                        case colIndex.get("Casting Time"): {
                            if (filterCastingTime(t, filter))
                                return true;
                            break;
                        }
                        case colIndex.get("Range"): {
                            if (filterRange(t, filter))
                                return true;
                            break;
                        }
                        case colIndex.get("Duration"): {
                            if (filterDuration(t, filter))
                                return true;
                            break;
                        }
                        default:
                            if (t.innerText.toLowerCase().includes(filter.toLowerCase()))
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
    for (let i = 0; i < result.length; i++) {
        let row = result[i];
        //row.style.display = "table-row";
        showRowsFiltering(row, i);
        table.appendChild(row);
    }
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

// logic for filtering different columns needs to be a bit different 
// because of how different values are structured
// I haven't come up with a good abstraction and went with the most 
// straightforward approach to write a function for each
function filterAccessWays(td, filter) {
    let innerText = td.innerText;
    // split access ways and search every part for starting with logic tree node
    // needed because antipaladin has paladin as a substring
    let lookforText = (item, index) => {
        if (item.startsWith(filter.toLowerCase())) {
            return true;
        }
    };

    let lookforNumbers = (item, index) => {
        if (item.includes(filter.toLowerCase())) {
            return true;
        }
    };

    let lookforNumbersWithComparison = (item, index) => {
        let operators = ['=', '<', '>'];
            let operator = null
            for(let i=0; i < operators.length; i++)
                if (filter.indexOf(operators[i]) !== -1) {
                    operator = operators[i]
                    break
                }
            let val = parseInt(filter.slice(1));

            let [className, level] = item.split(' ');
            level = parseInt(level, 10);
        
            switch(operator) {
                case '=':            
                    return level == val
                case '>':                    
                    return level > val
                case '<':
                    return level < val
            }
           
            return false
    }

    let lookforTextWithComparison = (item, index) => {
        if (item.startsWith(filter.slice(0, -2).toLowerCase())) {
            let operators = ['=', '<', '>'];
            let operator = null
            for(let i=0; i < operators.length; i++)
                if (filter.indexOf(operators[i]) !== -1) {
                    operator = operators[i]
                    break
                }
            let chunks = filter.split(operator)
            // The field is before the first operator
            let field = chunks.shift().trim()
            // Any subsequent operators should be part of the value we look for
            let val = chunks.join(operator).trim()

            let [className, level] = item.split(' ');
            level = parseInt(level, 10);
            let parsedItem = { [className]: level };
        
            if (parsedItem.hasOwnProperty(field)) {
                switch(operator) {
                    case '=':            
                        return parsedItem[field] == val
                    case '>':                    
                        return parsedItem[field] > val
                    case '<':
                        return parsedItem[field] < val
                }
            }
            return false
        }
    };

    let lookforFunc;
    if (digitRegex.test(filter)) {
        if (compRegex.test(filter)) 
            lookforFunc = lookforNumbersWithComparison;
        else
            lookforFunc = lookforNumbers;
    } else {
        if (compRegex.test(filter))
            lookforFunc = lookforTextWithComparison;
        else
            lookforFunc = lookforText;
    }
    let arr = innerText.toLowerCase().split("\n");
    let foundSomething = arr.some(lookforFunc);

    return foundSomething; 
}


function parseTimeInput(input) {
    let result = { code: null, length: null };
    
    const digitMatch = input.match(/^\d+/);
    let digits = 1;
    let unit;
    if (digitMatch) {
        digits = parseInt(digitMatch[0]);
        unit = input.substring(digitMatch[0].length).trim();
    } else {
        unit = input;
    }
    for (let [key, value] of timeUnits) {
        if (unit !== "" && key.startsWith(unit)) {
            result.code = value;
            result.length = digits;
            return result.code * 100 + result.length;
        }
    }

    return null
}


function filterCastingTime(td, filter) {
    let lookforText = (item, index) => {
        if (item.innerText.toLowerCase().includes(filter.toLowerCase())) {
            return true;
        }
    };

    let lookforTextWithComparison = (item, index) => {
        let operators = ['=', '<', '>'];
        let operator = null
        for(let i=0; i < operators.length; i++)
            if (filter.indexOf(operators[i]) !== -1) {
                operator = operators[i]
                break
            }
        let parsedFilter = parseTimeInput(filter.slice(1));
        // console.debug(filter.slice(1) + ":" + parsedFilter);
        let rowDataValue = parseInt(td.getAttribute("data-sort"));
    
        switch(operator) {
            case '=':            
                return rowDataValue == parsedFilter
            case '>':                    
                return rowDataValue > parsedFilter
            case '<':
                return rowDataValue < parsedFilter
        }
        
        return false
    };

    let lookforFunc;
    if (compRegex.test(filter))
        lookforFunc = lookforTextWithComparison;
    else
        lookforFunc = lookforText;
    let foundSomething = lookforFunc(td);

    return foundSomething; 
}


const regexFt = /(\d+)\s*(ft\.|feet|hex)/i;
const regexMiles = /(\d+)\s*(mile)/i;


function parseRangeInput(input) {
    let result = { code: null, length: null };
    
    const digitMatch = input.match(/^\d+/);
    let digits = 1;
    let unit;
    if (digitMatch) {
        digits = parseInt(digitMatch[0]);
        unit = input.substring(digitMatch[0].length).trim();
    } else {
        unit = input;
    }
    for (let [key, value] of rangeUnits) {
        if (key.startsWith(input)) {
            result.code = value;
            switch (result.code) {
                case 2:
                    result.distance = 25;
                    break;
                case 3:
                    result.distance = 100;
                    break;
                case 4:
                    result.distance = 400;
                    break;
                case 5:
                case 7: {
                    let match = input.match(regexFt);
                    if (match && match[1]) {
                        result.distance = parseInt(match[1]);
                        break;
                    }
                }
                case 6: {
                    let match = input.match(regexMiles);
                    if (match && match[1]) {
                        result.distance = parseInt(match[1]) * 1000;
                        break;
                    }
                }
                default:
                    break;
            }
            break;
        }
    }

    return result
}


function filterRange(td, filter) {
    let lookforText = (item, index) => {
        if (item.innerText.toLowerCase().includes(filter.toLowerCase())) {
            return true;
        }
    };

    let lookforTextWithComparison = (item, index) => {
        let operators = ['=', '<', '>'];
        let operator = null
        for(let i=0; i < operators.length; i++)
            if (filter.indexOf(operators[i]) !== -1) {
                operator = operators[i]
                break
            }
        let parsedFilter = parseRangeInput(filter.slice(1));
        // console.debug(filter.slice(1) + ":" + parsedFilter);
        let rowCode = parseInt(td.getAttribute("data-sort-code"));
        let rowDist = parseInt(td.getAttribute("data-sort-dist"));
    
        switch(operator) {
            case '=':
                if (rowCode == parsedFilter.code)            
                    return true
                break
            case '>':
                if (rowCode > parsedFilter.code)
                    return true
                else if (rowCode == parsedFilter.code)
                    return rowDist > parsedFilter.length
                break
            case '<':
                if (rowCode < parsedFilter.code)
                    return true
                else if (rowCode == parsedFilter.code)
                    return rowDist < parsedFilter.length
                break
        }
        
        return false
    };

    let lookforFunc;
    if (compRegex.test(filter))
        lookforFunc = lookforTextWithComparison;
    else
        lookforFunc = lookforText;
    let foundSomething = lookforFunc(td);

    return foundSomething; 
}


function parseDurationInput(input) {
    let result = { code: 100, length: null };
    
    const digitMatch = input.match(/^\d+/);
    let digits = 1;
    let unit;
    if (digitMatch) {
        digits = parseInt(digitMatch[0]);
        unit = input.substring(digitMatch[0].length).trim();
    } else {
        unit = input;
    }

    for (let [key, value] of durationUnits) {
        if (key.trim().startsWith(unit.trim())) {
            if ("minutes".startsWith(unit.trim()) && !unit.trim().includes("/"))
                result.code = 7;
            else if (unit.trim().includes("/"))
                result.code = 6;
            if ("hour".startsWith(unit.trim()) && !unit.trim().includes("/"))
                result.code = 9;
            else if (unit.trim().includes("/"))
                result.code = 8;
            else
                result.code = value;
            break;
        }
    }
    result.length = digits;

    return result.code * 100 + result.length;
}


function filterDuration(td, filter) {
    let lookforText = (item, index) => {
        if (item.innerText.toLowerCase().includes(filter.toLowerCase())) {
            return true;
        }
    };

    let lookforTextWithComparison = (item, index) => {
        let operators = ['=', '<', '>'];
        let operator = null
        for(let i=0; i < operators.length; i++)
            if (filter.indexOf(operators[i]) !== -1) {
                operator = operators[i]
                break
            }
        let parsedFilter = parseDurationInput(filter.slice(1));
        // console.debug(filter.slice(1) + ":" + parsedFilter)
        let rowDataValue = parseInt(td.getAttribute("data-sort"));
    
        switch(operator) {
            case '=':            
                return rowDataValue == parsedFilter
            case '>':                    
                return rowDataValue > parsedFilter
            case '<':
                return rowDataValue < parsedFilter
        }
        
        return false
    };

    let lookforFunc;
    if (compRegex.test(filter))
        lookforFunc = lookforTextWithComparison;
    else
        lookforFunc = lookforText;
    let foundSomething = lookforFunc(td);

    return foundSomething; 
}


export {
    filterTable
}
