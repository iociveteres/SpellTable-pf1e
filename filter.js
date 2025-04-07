import './logipar.js';
import {
    colIndex, divideChecked, hideRowsFiltering, showRowsFiltering,
    timeUnits, rangeUnits, durationUnits, SourceReleaseDates,
    extractSortParts, replacePartialWays
} from './utils.js';

const lp = new window.Logipar();
lp.overwrite(Token.AND, '&');
lp.overwrite(Token.OR, '|');
lp.overwrite(Token.XOR, '^');
lp.overwrite(Token.NOT, '!');

const lastGoodFilters = new Map();
const compRegex = new RegExp(/<=|>=|[<>=]/);
const digitRegex = new RegExp(/^(?:<=|>=|[<>=])?\d+$/);
const compClassesRegex = new RegExp(/([a-zA-Z]+)\s*(?:<=|>=|[<>=])\s*([a-zA-Z]+)/);

function filterTable(table, colnum, filters) {
    // Get tbody and all rows
    const tbody = table.getElementsByTagName('tbody')[0];
    const rows = Array.from(tbody.querySelectorAll('tr'));

    // Divide rows into checked rows (with description rows) and unchecked rows
    const { checkedRows, checkedDescs, uncheckedRows } = divideChecked(rows);

    // Hide all unchecked rows initially (they'll be shown if they pass filters)
    uncheckedRows.forEach(row => hideRowsFiltering(row));
    let result = uncheckedRows;

    // Iteratively filter out rows from the unchecked set
    filters.forEach((filter, position) => {
        if (filter) {
            filter = filter.toLowerCase();
            [, filter] = extractSortParts(filter)
            // Adjust filter string based on column-specific logic
            let improvedFilter;
            switch (position + 2) { // +1 for the Pin column, +1 for 0-index adjustment
                case colIndex.get("Access Ways"):
                    improvedFilter = replacePartialWays(filter);
                    break;
                case colIndex.get("PFS"):
                    improvedFilter = replaceYesNo(filter);
                    break;
                default:
                    improvedFilter = filter;
            }

            // Validate filter expression; fallback to last good filter if necessary
            try {
                lp.parse(improvedFilter);
                lastGoodFilters.set(position, improvedFilter);
            } catch (error) {
                lp.parse(lastGoodFilters.get(position));
            }

            // Build a filter function for the respective column
            const qs = `td:nth-child(${position + 2})`;
            const f = lp.filterFunction((row, filter) => {
                const t = row.querySelector(qs);
                switch (position + 2) {
                    case colIndex.get("Description"): {
                        const fDesc = new FilterDescription(filter);
                        if (fDesc.filter(t)) return true;
                        break;
                    }
                    case colIndex.get("Access Ways"): {
                        const fAccess = new FilterAccessWays(filter);
                        if (fAccess.filter(t)) return true;
                        break;
                    }
                    case colIndex.get("Casting Time"): {
                        const fCast = new FilterCastingTime(filter);
                        if (fCast.filter(t)) return true;
                        break;
                    }
                    case colIndex.get("Range"): {
                        const fRange = new FilterRange(filter);
                        if (fRange.filter(t)) return true;
                        break;
                    }
                    case colIndex.get("Duration"): {
                        const fDuration = new FilterDuration(filter);
                        if (fDuration.filter(t)) return true;
                        break;
                    }
                    case colIndex.get("Components"): {
                        const fComponents = new FilterComponents(filter);
                        if (fComponents.filter(t)) return true;
                        break;
                    }
                    default:
                        if (t.innerText.toLowerCase().includes(filter)) return true;
                }
                return false;
            });

            result = result.filter(row => f(row, improvedFilter));
        }
    });

    let visibleIndex = 0;

    rows.forEach(row => {
        if (checkedRows.includes(row)) {
            row.classList.remove('hidden-on-scroll');
            showRowsFiltering(row, visibleIndex++);
            
            const nameCell = row.querySelector(`td:nth-child(${colIndex.get("Name")})`);
            const name = nameCell ? nameCell.innerText.trim() : '';
            if (name && checkedDescs.has(name)) {
                const descRow = checkedDescs.get(name);
                descRow.classList.remove('hidden-on-scroll');
                showRowsFiltering(descRow, visibleIndex);
            }
        } else {
            if (result.includes(row)) {
                showRowsFiltering(row, visibleIndex++);
            } else {
                hideRowsFiltering(row);
            }
        }
    });
}




function replaceYesNo(string) {
    let result = string.replace(/yes/g, "✔")
    result = result.replace(/no/g, "!✔")

    return result;
}


function findOperator(string) {
    const operatorsExtended = ['<=', '>='];
    let operator;
    operator = operatorsExtended.find(op => string.includes(op));
    if (!(operator === undefined))
        return operator

    const operators = ['=', '<', '>'];
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
        const operator = findOperator(this.filterValue)

        const val = parseInt(this.filterValue.slice(operator.length));
        let [className, level] = item.split(' ');
        level = parseInt(level, 10);

        return useOperator(operator, level, val)
    }

    lookforTextWithComparison(item) {
        const operator = findOperator(this.filterValue)
        if (!item.startsWith(this.filterValue.slice(0, -(1+operator.length)))) return false;

        const chunks = this.filterValue.split(operator);
        // The field is before the first operator
        const field = chunks.shift().trim();
        // Any subsequent operators should be part of the value we look for
        const val = chunks.join(operator).trim();

        let [className, level] = item.split(' ');
        level = parseInt(level, 10);
        const parsedItem = { [className]: level };

        if (parsedItem.hasOwnProperty(field)) {
            return useOperator(operator, parsedItem[field], val)
        }
        return false;
    }

    lookforClassesWithComparison(td) {
        const operator = findOperator(this.filterValue)
        const parts = this.filterValue.split(operator).map(part => part.trim());

        const arr = td.innerText.toLowerCase().split("\n");
        const before = arr.find(item => item.includes(parts[0]));
        const after = arr.find(item => item.includes(parts[1]));

        if (!(before && after))
            return false

        let [className, level] = before.split(' ');
        const parsedBefore = parseInt(level, 10);

        [className, level] = after.split(' ');
        const parsedAfter = parseInt(level, 10);

        return useOperator(operator, parsedBefore, parsedAfter)
    }

    filter(td) {
        if (compClassesRegex.test(this.filterValue)) {
            return this.lookforClassesWithComparison(td)
        }

        const arr = td.innerText.toLowerCase().split("\n");

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
        const operator = findOperator(this.filterValue)

        const parsedFilter = this.parseTimeInput(this.filterValue.slice(operator.length));
        const rowDataValue = parseInt(td.getAttribute("data-sort"));

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
                        const match = input.match(regexFt);
                        if (match && match[1]) {
                            result.distance = parseInt(match[1]);
                            break;
                        }
                    }
                    case 6: {
                        const match = input.match(regexMiles);
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
        const operator = findOperator(this.filterValue)

        const parsedFilter = this.parseRangeInput(this.filterValue.slice(operator.length));
        const rowCode = parseInt(td.getAttribute("data-sort-code"));
        const rowDist = parseInt(td.getAttribute("data-sort-dist"));

        switch (operator) {
            case '=':
                if (rowCode == parsedFilter.code)
                    return true
                break
            case '>':
                if (rowCode > parsedFilter.code)
                    return true
                else if (rowCode == parsedFilter.code)
                    return rowDist > parsedFilter.distance
                break
            case '<':
                if (rowCode < parsedFilter.code)
                    return true
                else if (rowCode == parsedFilter.code)
                    return rowDist < parsedFilter.distance
                break
            case '>=':
                if (rowCode > parsedFilter.code)
                    return true
                else if (rowCode == parsedFilter.code)
                    return rowDist >= parsedFilter.distance
                break
            case '<=':
                if (rowCode < parsedFilter.code)
                    return true
                else if (rowCode == parsedFilter.code)
                    return rowDist <= parsedFilter.distance
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
        const operator = findOperator(this.filterValue)

        const parsedFilter = this.parseDurationInput(this.filterValue.slice(operator.length));
        const rowDataValue = parseInt(td.getAttribute("data-sort"));

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
        super(filterValue);
    }

    /**
     * Generic method to check if a td attribute contains the filtered value.
     * @param {HTMLElement} td 
     * @param {string} attribute - The attribute to check (e.g., "title", "source", "mythic-description").
     * @param {string} value - The already cleaned filter value.
     * @returns {boolean}
     */
    matchAttribute(td, attribute, value) {
        if (!td.hasAttribute(attribute)) {
            return false;
        }
        if (value === "") {
            return true;
        }
        return td.getAttribute(attribute).toLowerCase().includes(value.toLowerCase());
    }

    /**
     * Generic method to check before/after dates for an attribute.
     * @param {HTMLElement} td 
     * @param {string} attribute - The attribute to check (e.g., "source" or "mythic-source").
     * @param {string} date - The cleaned date value (prefix already removed).
     * @param {boolean} isBefore - If true, checks if date is before; otherwise, after.
     * @returns {boolean}
     */
    matchDate(td, attribute, date, isBefore) {
        if (date === "") return true;
        if (!td.hasAttribute(attribute)) return false;

        return td.getAttribute(attribute)
            .split(/pg\.\s*\d+,?/)
            .filter(Boolean)
            .map(s => s.trim())
            .map(title => SourceReleaseDates.get(title) || "0000-00-00")
            .some(attrDate => isBefore ? attrDate <= date : attrDate >= date);
    }

    filter(td) {
        const cleanValue = (prefix) =>
            this.filterValue.replace(new RegExp(`^${prefix}:\\s*`), "");

        const filters = {
            "full desc": () => this.matchAttribute(td, "title", cleanValue("full desc")),
            "source": () => this.matchAttribute(td, "source", cleanValue("source")),
            "mythic desc": () => this.matchAttribute(td, "mythic-description", cleanValue("mythic desc")),
            "mythic source": () => this.matchAttribute(td, "mythic-source", cleanValue("mythic source")),
            "before": () => this.matchDate(td, "source", cleanValue("before"), true),
            "after": () => this.matchDate(td, "source", cleanValue("after"), false),
            "mythic before": () => this.matchDate(td, "mythic-source", cleanValue("mythic before"), true),
            "mythic after": () => this.matchDate(td, "mythic-source", cleanValue("mythic after"), false),
        };

        for (let key in filters) {
            if (this.filterValue.startsWith(`${key}:`)) {
                return filters[key]();
            }
        }

        return this.lookforText(td);
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
        const operator = findOperator(this.filterValue)

        const parsedFilter = parseInt(price.slice(operator.length));
        const rowDataValue = parseInt(td.getAttribute("price"));

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
