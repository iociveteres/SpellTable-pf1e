import { sortTable } from './sort.js'
import { filterTable } from './filter.js';
import { colIndex, timeUnits, rangeUnits, durationUnits } from './utils.js';

let table = document.getElementById('table-spells')
let filterInputs = Array();
table.querySelectorAll("th").forEach((th, position) => {
    if (position!= 0) {
        filterInputs.push(th.querySelector("input"));
        
        th.querySelector("button").addEventListener("click", evt => {
            clearTempRows(table);
            let newDir = sortTable(table, position, th.getAttribute("dir"));  
            table.querySelectorAll("th").forEach((th) => {
                th.setAttribute("dir", "no")
            });
            th.setAttribute("dir", newDir);
            document.getElementById("spellcount").innerText = String(countRows(table) + " spells")
        })

        th.querySelector("input").addEventListener("input", debounce(evt => {
            clearTempRows(table);
            let filterValues = filterInputs.map((filter) => filter.value);
            filterTable(table, position, filterValues);  
            document.getElementById("spellcount").innerText = String(countRows(table) + " spells")
        }, 300));
    }
});

document.getElementById('toggle-top-bar').addEventListener("click", evt => {
    toggleTopFixedBar();
})

document.getElementById('clear-inputs').addEventListener("click", evt => {
    clearInputFields();
    let filterValues = filterInputs.map((filter) => filter.value);
    filterTable(table, 0, filterValues)
})

document.getElementById('unpin-all').addEventListener("click", evt => {
    unpinAll()
})

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

                let range = parseRange(spell.Range);

                out += `
                    <tr class="data-row">
                        <td><input type="checkbox" /></td>
                        <td linkAon="${linkAon}" linkD20="${linkD20}">${spell.Name}</td>
                        <td title="${FullDescription}">${ShortDescription}</td>  
                        <td>${spell.School}</td>
                        <td>${Subschool}</td>
                        <td>${Descriptors}</td>
                        <td style="position:relative; white-space:pre; word-wrap:break-word; z-index:1"><div style="width:inherit; height:60px; line-height:20px; overflow:hidden; " title="${access_ways}">${threeDotsDiv}${access_ways}</div></td>
                        <td data-sort="${parseTime(spell["Casting time"])}">${spell["Casting time"]}</td>
                        <td>${spell.Components}</td>
                        <td data-sort-code="${range.code}" data-sort-dist="${range.distance}">${spell.Range}</td>
                        <td>${Effect}</td>
                        <td>${Target}</td>
                        <td data-sort="${parseDuration(spell.Duration)}">${spell.Duration}</td>
                        <td>${SavingThrow}</td>
                        <td>${SpellResistance}</td>
                        <td>${PFSLegal}</td>                                    
                    </tr>
                `;
            }
            placeholder.innerHTML = out;
            document.getElementById("spellcount").innerText = String(countRows(table) + " spells")
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

            // events for rows, checkbox save and onclick description
            let rows = Array.from(table.querySelectorAll(`tr`));;
            rows = rows.slice(1);
            rows.forEach((tr, position) => {
                let checkbox = tr.querySelector('td:first-child input[type="checkbox"]');
                checkbox.addEventListener('change', evt => {
                    var checkboxName = checkbox.getAttribute('name');
                    localStorage.setItem(checkboxName, checkbox.checked);
                });

                let clickStartTime;
                // not to trigger creating additional row on selecting text
                tr.addEventListener('mousedown', evt => {
                    // if (evt.target !== tr.firstElementChild)
                    if (!evt.target.closest('td:first-child'))
                        clickStartTime = new Date().getTime(); 
                });

                tr.addEventListener('mouseup', evt => {
                    const clickDuration = new Date().getTime() - clickStartTime;
                    if (clickDuration < 300) { 
                        makeDescriptionRow(tr)
                    } 
                });
            }); 

            loadCheckboxStates()
            let filterValues = filterInputs.map((filter) => filter.value);
            filterTable(table, 0, filterValues)
            document.getElementById("spellcount").innerText = String(countRows(table) + " spells")
        });
});


let preFormattedDescription;
fetch("preFormattedDescriptions.json")
    .then(function (response) {
        return response.json();
    })
    .then(function (data) {
        preFormattedDescription = data;
    })


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
        let fullDescription = tr.querySelector(`td:nth-child(${colIndex.get("Description")})`).getAttribute("title");
        let accessWays = tr.querySelector(`td:nth-child(${colIndex.get("Access ways")})`).textContent.replace("...", "");
        let parentDiv = document.createElement('div');
        parentDiv.classList.add("dropdown");

        let aD20 = "";
        let aAon = "";
        let linkAon = tr.querySelector(`td:nth-child(${colIndex.get("Name")})`).getAttribute("linkAon");
        if (linkAon !== "None")
            aAon = `<a href="${linkAon}" target="_new">AoNprd</a>`;
        let linkD20 = tr.querySelector(`td:nth-child(${colIndex.get("Name")})`).getAttribute("linkD20");
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


function clearTempRows(table) {
    let rows = table.querySelectorAll('tr');
    
    let prevRowChecked;
    rows.forEach(row => {
        // Check if the row has the specified classes
        if (!prevRowChecked && (row.classList.contains('hidden-row') || row.classList.contains('show-row'))) {
            // If it does, remove the row
            row.remove();
        }

        let checkbox = row.querySelector('td:first-child input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
            prevRowChecked = true;
        } else {
            prevRowChecked = false;
        }
    });
}


function countRows(table) {
    let rows = table.querySelectorAll('tr');

    let visibleRowCount = 0;
    for (let i = 1; i < rows.length; i++) {
        if (rows[i].style.display !== 'none') {

            visibleRowCount++;
        }
    }
    return visibleRowCount;
}


function toggleTopFixedBar() {
    var topFixedBar = document.getElementById("top-bar");
    topFixedBar.classList.toggle('hidden');
}


function clearInputFields() {
    var inputFields = document.querySelectorAll('.spelltable input[type="text"]');
    inputFields.forEach(function(input) {
        input.value = '';
    });
}


function unpinAll() {
    let checkboxes = document.querySelectorAll('td:first-child input[type="checkbox"]');
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = false;
    });
}


function loadCheckboxStates() {
    let checkboxes = document.querySelectorAll('td:first-child input[type="checkbox"]');
    checkboxes.forEach(function(checkbox) {
      var checkboxName = checkbox.getAttribute('name');
      var checkboxState = localStorage.getItem(checkboxName);
      if (checkboxState === 'true') {
        checkbox.checked = true;
      } else {
        checkbox.checked = false;
      }
    });
  }

const regexTime = /(\d+)\s*(round|minute|hour|day|week)/i;

function parseTime(input) {
    let result = { code: null, length: null };

    for (let [key, value] of timeUnits) {
        if (input.includes(key)) {
            result.code = value;
            switch (result.code) {
                case 7:
                case 8:
                case 9:
                case 10:
                case 11: 
                case 12:
                    let match = input.match(regexTime);
                    if (match && match[1]) {
                        result.length = parseInt(match[1]);
                    }
                    break;
                default:
                    result.length = 1;
                    break;
            }
            break;
        }
    }

    return result.code * 100 + result.length;
}

const regexFt = /(\d+)\s*(ft\.|feet|hex)/i;
const regexMiles = /(\d+)\s*(mile)/i;

function parseRange(input) {
    let result = { code: null, distance: null };
    
    for (let [key, value] of rangeUnits) {
        if (input.includes(key)) {
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
    return result;
}


const regexDur = /(\d+)\s*(round| min| hour| day| battle)/i;

function parseDuration(input) {
    let result = { code: 100, length: null };
    
    for (let [key, value] of durationUnits) {
        if (input.includes(key)) {
            if (input.includes(" minutes") && !input.includes(" minutes/"))
                result.code = 7;
            else if (input.includes(" minutes/"))
                result.code = 6;
            else
                result.code = value;
            switch (result.code) {
                case 2:
                case 3:
                case 5:
                case 6:
                case 7: 
                case 9:
                case 11:
                case 12:
                case 13:
                case 14:
                case 15:
                    let match = input.match(regexDur);
                    if (match && match[1]) {
                        result.length = parseInt(match[1]);
                    }
                    break;
                default:
                    result.length = 1;
                    break;
            }
            break;
        }
    }
    return result.code * 100 + result.length;
}
