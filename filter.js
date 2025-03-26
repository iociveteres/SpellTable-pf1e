import './logipar.js';
import {
    colIndex, divideChecked, hideRowsFiltering, showRowsFiltering,
    timeUnits, rangeUnits, durationUnits
} from './utils.js';

const lp = new window.Logipar();
lp.overwrite(Token.AND, '&');
lp.overwrite(Token.OR, '|');
lp.overwrite(Token.XOR, '^');
lp.overwrite(Token.NOT, '!');

const lastGoodFilters = new Map();
const compRegex = new RegExp(/[=<>]/);
const digitRegex = new RegExp(/^(?:<=|>=|[<>=])?\d+$/);
const compClassesRegex = new RegExp(/([a-zA-Z]+)\s*(?:<=|>=|[<>=])\s*([a-zA-Z]+)/);

function filterTable(table, colnum, filters) {
    // console.debug('filter: ' + (filters))
    // console.time('filter')
    // get all the rows in this table:
    let tbody = table.getElementsByTagName(`tbody`)[0]
    let rows = Array.from(tbody.querySelectorAll(`tr`));

    // only unchecked rows need filtering
    let { checkedRows, uncheckedRows } = divideChecked(rows);

    // hide all rows
    uncheckedRows.forEach(row => hideRowsFiltering(row));
    let result = uncheckedRows;

    // iteratively filter out rows 
    filters.forEach((filter, position) => {
        // filter if string is not empty
        if (filter) {
            filter = filter.toLowerCase();
            // for convinience replace "wizard" with "sorcere/wizard", etc
            let improvedFilter;
            switch (position + 2) { // +1 is from Pin without input, +1 because array index starts from 0, really dislike it
                case colIndex.get("Access ways"):
                    improvedFilter = replacePartialWays(filter);
                    break
                case colIndex.get("PFS"):
                    improvedFilter = replaceYesNo(filter);
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
                    case colIndex.get("Description"): {
                        f = new FilterDescription(filter)
                        if (f.filter(t))
                            return true
                        break;
                    }
                    case colIndex.get("Access ways"): {
                        f = new FilterAccessWays(filter)
                        if (f.filter(t))
                            return true;
                        break;
                    }
                    case colIndex.get("Casting Time"): {
                        f = new FilterCastingTime(filter)
                        if (f.filter(t))
                            return true;
                        break;
                    }
                    case colIndex.get("Range"): {
                        f = new FilterRange(filter)
                        if (f.filter(t))
                            return true;
                        break;
                    }
                    case colIndex.get("Duration"): {
                        f = new FilterDuration(filter)
                        if (f.filter(t))
                            return true;
                        break;
                    }
                    case colIndex.get("Components"): {
                        f = new FilterComponents(filter)
                        if (f.filter(t))
                            return true;
                        break;
                    }
                    default:
                        if (t.innerText.toLowerCase().includes(filter))
                            return true;
                }
                return false;
            });

            result = result.filter(f);
            // console.debug(lp.stringify());
        }
    });
    // append checked rows first
    checkedRows.forEach((row, i) => {
        row.classList.remove('hidden-on-scroll');
        tbody.appendChild(row)
    });
    // show again rows matching all filters
    for (let i = 0; i < result.length; i++) {
        let row = result[i];
        //row.style.display = "table-row";
        showRowsFiltering(row, i);
        tbody.appendChild(row);
    }
    // console.timeEnd('filter')
}


function replacePartialWays(string) {
    let result = string.replace(/wizard|sorcerer/g, "sorcerer/wizard");
    result = result.replace(/cleric|oracle/g, "cleric/oracle");
    return result;
}


function replaceYesNo(string) {
    let result = string.replace(/yes/g, "✔")
    result = result.replace(/no/g, "!✔")

    return result;
}


function findOperator(string) {
    let operatorsExtended = ['<=', '>='];
    let operator;
    operator = operatorsExtended.find(op => string.includes(op));
    if (!(operator === undefined))
        return operator

    let operators = ['=', '<', '>'];
    operator = operators.find(op => string.includes(op));
    return operator
}

function useOperator(operator, op1, op2) {
    switch (operator) {
        case '=': return op1 == op2;
        case '>': return op1 > op2;
        case '<': return op1 < op2;
        case '<=': return op1 <= op2;
        case '>=': return op1 >= op2;
    }
    return false
}

class FilterBase {
    constructor(filterValue) {
        this.filterValue = filterValue;
    }

    lookforText(item) {
        return item.innerText.toLowerCase().includes(this.filterValue);
    };
}

// // logic for filtering different columns needs to be a bit different 
// // because of how different values are structured
// // I haven't come up with a good abstraction and went with the most 
// // straightforward approach to write a class for each
class FilterAccessWays extends FilterBase {
    constructor(filter) {
        super(filter);
    }

    // item 
    lookforText(item) {
        return item.startsWith(this.filterValue);
    }

    lookforNumbers(item) {
        return item.includes(this.filterValue);
    }

    lookforNumbersWithComparison(item) {
        let operator = findOperator(this.filterValue)

        let val = parseInt(this.filterValue.slice(operator.length));
        let [className, level] = item.split(' ');
        level = parseInt(level, 10);

        return useOperator(operator, level, val)
    }

    lookforTextWithComparison(item) {
        if (!item.startsWith(this.filterValue.slice(0, -2))) return false;

        let operator = findOperator(this.filterValue)
        // if (!operator) return false;

        let chunks = this.filterValue.split(operator);
        // The field is before the first operator
        let field = chunks.shift().trim();
        // Any subsequent operators should be part of the value we look for
        let val = chunks.join(operator).trim();

        let [className, level] = item.split(' ');
        level = parseInt(level, 10);
        let parsedItem = { [className]: level };

        if (parsedItem.hasOwnProperty(field)) {
            return useOperator(operator, parsedItem[field], val)
        }
        return false;
    }

    lookforClassesWithComparison(td) {
        let operator = findOperator(this.filterValue)
        let parts = this.filterValue.split(operator).map(part => part.trim());

        let arr = td.innerText.toLowerCase().split("\n");
        let before = arr.find(item => item.includes(parts[0]));
        let after = arr.find(item => item.includes(parts[1]));

        if (!(before && after))
            return false

        let [className, level] = before.split(' ');
        let parsedBefore = parseInt(level, 10);

        [className, level] = after.split(' ');
        let parsedAfter = parseInt(level, 10);

        return useOperator(operator, parsedBefore, parsedAfter)
    }

    filter(td) {
        if (compClassesRegex.test(this.filterValue)) {
            return this.lookforClassesWithComparison(td)
        }

        let arr = td.innerText.toLowerCase().split("\n");

        let lookforFunc;
        if (digitRegex.test(this.filterValue)) {
            lookforFunc = compRegex.test(this.filterValue)
                ? this.lookforNumbersWithComparison.bind(this)
                : this.lookforNumbers.bind(this);
        } else {
            lookforFunc = compRegex.test(this.filterValue)
                ? this.lookforTextWithComparison.bind(this)
                : this.lookforText.bind(this);
        }

        return arr.some(lookforFunc);
    }
}


class FilterCastingTime extends FilterBase {
    constructor(filterValue) {
        super(filterValue);
    }

    parseTimeInput(input) {
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

        return null;
    }

    lookforTextWithComparison(td) {
        let operator = findOperator(this.filterValue)

        let parsedFilter = this.parseTimeInput(this.filterValue.slice(operator.length));
        let rowDataValue = parseInt(td.getAttribute("data-sort"));

        return useOperator(operator, rowDataValue, parsedFilter)
    };

    filter(td) {
        if (compRegex.test(this.filterValue)) {
            return this.lookforTextWithComparison.bind(this)(td)
        }

        return this.lookforText.bind(this)(td);
    }
}

class FilterRange extends FilterBase {
    constructor(filterValue) {
        super(filterValue)
    }

    regexFt = /(\d+)\s*(ft\.|feet|hex)/i;
    regexMiles = /(\d+)\s*(mile)/i;

    parseRangeInput(input) {
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

    lookforTextWithComparison(td) {
        let operator = findOperator(this.filterValue)

        let parsedFilter = this.parseRangeInput(this.filterValue.slice(operator.length));
        let rowCode = parseInt(td.getAttribute("data-sort-code"));
        let rowDist = parseInt(td.getAttribute("data-sort-dist"));

        switch (operator) {
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
            case '>=':
                if (rowCode >= parsedFilter.code)
                    return true
                else if (rowCode == parsedFilter.code)
                    return rowDist >= parsedFilter.length
                break
            case '<=':
                if (rowCode <= parsedFilter.code)
                    return true
                else if (rowCode == parsedFilter.code)
                    return rowDist <= parsedFilter.length
                break
        }

        return false
    };

    filter(td) {
        if (compRegex.test(this.filterValue)) {
            return this.lookforTextWithComparison.bind(this)(td);
        }

        return this.lookforText.bind(this)(td);
    }
}


class FilterDuration extends FilterBase {
    constructor(filterValue) {
        super(filterValue)
    }

    parseDurationInput(input) {
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

    lookforTextWithComparison(td) {
        let operator = findOperator(this.filterValue)

        let parsedFilter = this.parseDurationInput(this.filterValue.slice(operator.length));
        let rowDataValue = parseInt(td.getAttribute("data-sort"));

        return useOperator(operator, rowDataValue, parsedFilter)
    };

    filter(td) {
        if (compRegex.test(this.filterValue)) {
            return this.lookforTextWithComparison.bind(this)(td)
        }

        return this.lookforText.bind(this)(td);
    }
}

class FilterDescription extends FilterBase {
    constructor(filterValue) {
        super(filterValue)
    }

    lookforFullDesc(td) {
        return td.getAttribute("title").toLowerCase().includes(this.filterValue.replace(/full desc:\s*/, ""));
    };

    lookforSource(td) {
        return td.getAttribute("source").toLowerCase().includes(this.filterValue.replace(/source:\s*/, ""));
    };

    lookforMythicDescription(td) {
        if (!td.hasAttribute("mythic-description")) {
            return false
        }
        let f = this.filterValue.replace(/mythic desc:\s*/, "")
        if (f == "") {
            return true
        }
        return td.getAttribute("mythic-description").toLowerCase().includes(f);
    };

    lookforMythicSource(td) {
        if (!td.hasAttribute("mythic-source")) {
            return false
        }
        let f = this.filterValue.replace(/mythic source:\s*/, "")
        if (f == "") {
            return true
        }
        return td.getAttribute("mythic-source").toLowerCase().includes(f);
    };


    filter(td) {
        if (this.filterValue.startsWith("full desc:"))
            return this.lookforFullDesc.bind(this)(td)
        if (this.filterValue.startsWith("source:"))
            return this.lookforSource.bind(this)(td)
        if (this.filterValue.startsWith("mythic desc:"))
            return this.lookforMythicDescription.bind(this)(td)
        if (this.filterValue.startsWith("mythic source:"))
            return this.lookforMythicSource.bind(this)(td)

        return this.lookforText.bind(this)(td);
    }
}


class FilterComponents extends FilterBase {
    constructor(filterValue) {
        super(filterValue)
    }

    lookforPrice(td) {
        let price = this.filterValue.replace(/price:\s*/, "")
        if (compRegex.test(price)) {
            return this.lookforTextWithComparison.bind(this)(td, price)
        }

        this.filterValue = "Price: =" + price
        price = "=" + price
        return this.lookforTextWithComparison.bind(this)(td, price)
    };

    lookforTextWithComparison(td, price) {
        let operator = findOperator(this.filterValue)

        let parsedFilter = parseInt(price.slice(operator.length));
        let rowDataValue = parseInt(td.getAttribute("price"));

        return useOperator(operator, rowDataValue, parsedFilter)
    };

    filter(td) {
        if (this.filterValue.startsWith("price:"))
            return this.lookforPrice.bind(this)(td)

        return this.lookforText.bind(this)(td);
    }
}

export {
    filterTable
}
