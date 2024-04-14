import { sortTable } from './sort.js'
import { filterTable } from './filter.js';

let table = document.getElementById('table_spells')
let filterInputs = Array();
table.querySelectorAll("th").forEach((th, position) => {
    filterInputs.push(th.querySelector("input"));

    th.querySelector("button").addEventListener("click", evt => {
        clearTempRows(table);
        let newDir = sortTable(table, position, th.getAttribute("dir"));  
        table.querySelectorAll("th").forEach((th) => {
            th.setAttribute("dir", "no")
        });
        th.setAttribute("dir", newDir);
    })

    th.querySelector("input").addEventListener("input", debounce(evt => {
        clearTempRows(table);
        let filterValues = filterInputs.map((filter) => filter.value);
        filterTable(table, position, filterValues);  
    }, 300));
});


document.addEventListener("DOMContentLoaded", function () {
    fetch("spellList_v1.1.json")
        .then(function (response) {
            return response.json();
        })
        .then(function (spells) {
            console.log(spells.length);
            console.time('parse')
            let placeholder = document.querySelector("#data-output");
            let out = "";

            // let uniqueNames = findUniqueValuesByKey(spells, "Casting time");
            // console.log([...uniqueNames]); 

            for (let spell of spells) { 
                let linkAon = spell["Url aon"];
                let linkD20 = spell["Url d20"];
                let PFSLegal = spell["PFS legal"] == true ? "✔" : " ";
                let Subschool = spell.Subschool == "None" ? "" :spell.Subschool
                let Descriptors = spell.Descriptors == "None" ? "" :spell.Descriptors
                let Effect = spell.Effect == "None" ? "" : spell.Effect
                let Target = spell.Target == "None" ? "": spell.Target
                let SavingThrow = spell["Saving throw"] === undefined ? "" : spell["Saving throw"]
                let SpellResistance = spell["Spell Resistance"] === undefined ? "" : spell["Spell Resistance"]
                let ShortDescription = spell["Short description"] === undefined ? "" : spell["Short description"]
                let FullDescription = spell["Description"] === undefined ? "" : spell["Description"]
                let access_ways = "";
                try {
                let result = Object.entries(spell["access_ways"]).map(([key, value]) => {
                    return value.map(item => {
                            return item.join(' ');
                        }).join('\n');
                    }).join('\n');
                    access_ways = result;
                } catch (err) {
                    //console.error("Error: ", spell.Name)
                }
                let threeDotsDiv = "";
                if (countNewLines(access_ways) >= 3) {
                    threeDotsDiv = `<div style="position:absolute; bottom:0px; right:2px; font-weight: bold;">...</div>`
                }

                out += `
                    <tr class="data-row">
                        <td>${spell.Name}</td>
                        <td title="${FullDescription}">${ShortDescription}</td>  
                        <td>${spell.School}</td>
                        <td>${Subschool}</td>
                        <td>${Descriptors}</td>
                        <td style="position:relative; white-space:pre; word-wrap:break-word; z-index:1"><div style="width:inherit; height:60px; line-height:20px; overflow:hidden; " title="${access_ways}">${threeDotsDiv}${access_ways}</div></td>
                        <td data-sort="${parseTime(spell["Casting time"])}">${spell["Casting time"]}</td>
                        <td>${spell.Components}</td>
                        <td>${spell.Range}</td>
                        <td>${Effect}</td>
                        <td>${Target}</td>
                        <td>${spell.Duration}</td>
                        <td>${SavingThrow}</td>
                        <td>${SpellResistance}</td>
                        <td>${PFSLegal}</td>                                    
                    </tr>
                `;
            }
            placeholder.innerHTML = out;
            console.timeEnd('parse')

            // fix col width
            var cells = table.getElementsByTagName("td");
            var max_widths = [];
            for (var i = 0; i < cells.length; i++) {
                var cell_width = cells[i].offsetWidth;
                var col_index = cells[i].cellIndex;
                if (!max_widths[col_index] || cell_width > max_widths[col_index]) {
                    max_widths[col_index] = cell_width;
                }
            }
            // apply the maximum width found for each column
            var headers = table.getElementsByTagName("th");
            for (var i = 0; i < headers.length; i++) {
                headers[i].style.width = max_widths[i] + "px";  
            }

            // on click add row with description
            let rows = Array.from(table.querySelectorAll(`tr`));;
            rows = rows.slice(1);
            rows.forEach((tr, position) => {
                let clickStartTime;
                // not to trigger creating additional row on selecting text
                tr.addEventListener('mousedown', evt => {
                    clickStartTime = new Date().getTime(); 
                });

                tr.addEventListener('mouseup', evt => {
                    const clickDuration = new Date().getTime() - clickStartTime;
                    if (clickDuration < 300) { 
                        makeDescriptionRow(tr)
                    } 
                });
            }); 
        });
});


function debounce(func, delay=300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

function makeDescriptionRow(tr) {
    let innerDivs;
    let nextRow = tr.nextElementSibling;
    if (!nextRow.classList.contains('show-row') && !nextRow.classList.contains('hidden-row')) {
        let newRow = document.createElement('tr');
        let newCell = document.createElement('td');
        newCell.colSpan = "100";                            
        let fullDescription = tr.querySelector(`td:nth-child(${2})`).getAttribute("title");
        let accessWays = tr.querySelector(`td:nth-child(${6})`).textContent.replace("...", "");
        let parentDiv = document.createElement('div');
        parentDiv.classList.add("dropdown");

        let aD20 = "";
        let aAon = "";
        let linkAon = tr.querySelector(`td:nth-child(${1})`).getAttribute("linkAon");
        if (linkAon !== "None")
            aAon = `<a href="${linkAon}" target="_new">AoNprd</a>`;
        let linkD20 = tr.querySelector(`td:nth-child(${1})`).getAttribute("linkD20");
        if (linkD20 !== "None")
            aD20 = `<a href="${linkD20}" target="_new">d20pfsrd</a>`;
        
        innerDivs = `
            <div class="dropdown-links">
                ${aAon} \n
                ${aD20}
            </div>
            <div class="dropdown-description">
                ${fullDescription}
            </div>
            <div class="dropdown-access-ways">
                <pre>${accessWays}</pre>
            </div>`;
        parentDiv.innerHTML = innerDivs;

        newCell.appendChild(parentDiv);
        newRow.appendChild(newCell);
        newRow.classList.add('show-row');
        tr.parentNode.insertBefore(newRow, nextRow);
    } else {
        nextRow.classList.toggle('hidden-row');
        nextRow.classList.toggle('show-row');
    }  
}


function countNewLines(str) {
    var matches = str.match(/\n/g);
    return matches ? matches.length : 0;
}

function parseTime(time) {
    const timeUnits = [
        "free action", "immediate action", "swift action", "move action", "standard action",
        "full-round action", "full round", "round", "minute", "hour", "day", "week"
    ];

    let parts;
    if (time.includes(";")) { // try to split by any special characters 
        parts = time.split(";")
    } else if (time.includes(",")) { 
        parts = time.split(",")
    } else if (time.includes("(")) {
        parts = time.split("(")
        parts[1] = parts[1].slice(0, -1);
    } else if (time.includes("/")) {
        parts = time.split("/")
        parts[1] = '/' + parts[1]
    } else if (time.includes("or")) {
        parts = time.split("or")
    } else if (time.includes("see")) { // case where there is only special text
        parts = Array("", time);
    } else { // comma
        parts = Array(time)
    } 
    // it can be optimised by handling any non special first
    let timePart = parts[0].trim();
    let specialPart = parts[1] ? parts[1].trim() : null;

    let timeValue;
    let timeUnitCode;

    for (let [i, unit] of timeUnits.entries()) {
        if (timePart.includes(unit)) {
            let timePartSplit = timePart.split(unit);
            timeValue = parseInt(timePartSplit[0].trim().replace(/\D+/g, ''));
            timeUnitCode = i // for easier comparison

function clearTempRows(table) {
    let rows = table.querySelectorAll('tr');

    // Loop through each row
    rows.forEach(row => {
        // Check if the row has the specified classes
        if (row.classList.contains('hidden-row') || row.classList.contains('show-row')) {
            // If it does, remove the row
            row.remove();
        }
    });
}
            break;
        }
    }

    timeUnitCode = timeUnitCode ? timeUnitCode : 100;
    timeValue = timeValue ? timeValue : 0;

    return timeUnitCode * 100 + timeValue;
}


            }
        }

        if (!timeValue || !timeUnit) {
            timeValue = timePart;
        }
        timeUnitCode = timeUnitCode ? timeUnitCode : 100,

        parsedItems.push({
            timeValue: timeUnit ? timeValue : null,
            timeUnit: timeUnit ? timeUnit : null,
            specialPart: specialPart,
            timeUnitCode: timeUnit ? timeUnitCode : 100,
            value: timeUnitCode * 100 + timeValue
        });
    });

    return parsedItems;
}
