import { sortTable } from './sort.js'
import { filterTable } from './filter.js';
import { colIndex, showRowsScrolling, rowsReveal, 
         timeUnits, rangeUnits, durationUnits } from './utils.js';

let themeToggleBtn = document.querySelector("#toggle-darkmode");
const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
const currentTheme = localStorage.getItem("theme");
if (currentTheme == "dark") {
    document.body.classList.toggle("dark-mode");
} else if (currentTheme == "light") {
    document.body.classList.toggle("light-mode");
}
{
    let allElements = document.querySelectorAll('*');
    allElements.forEach(function(el) {
        el.offsetHeight; // Trigger reflow
    });
    document.querySelector("body").classList.remove("notransition");
}

themeToggleBtn.addEventListener("click", function() {    
    if (prefersDarkScheme.matches) {
        document.body.classList.toggle("light-mode");
        var theme = document.body.classList.contains("light-mode") ? "light" : "dark";
    } else {
        document.body.classList.toggle("dark-mode");
        var theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
    }
    localStorage.setItem("theme", theme);
    console.log("switched to " + theme)
});

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
            window.scrollTo(0, 0)
            updateSpellCount();
        })

        th.querySelector("input").addEventListener("input", debounce(evt => {
            clearTempRows(table);
            let filterValues = filterInputs.map((filter) => filter.value);
            filterTable(table, position, filterValues);
            window.scrollTo(0, 0)
            updateSpellCount();
        }, 300));
    }
});

{
    let topFixedBar = document.getElementById("top-bar");
    topFixedBar.classList.toggle('hidden');
    let topFixedBarVisibility = localStorage.getItem('topFixedBarVisibility');
    console.log(topFixedBarVisibility);
    if (topFixedBarVisibility === 'true') {
        topFixedBar.classList.add('hidden')
    } else {
        topFixedBar.classList.remove('hidden')
    }
}

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
            let placeholder = document.getElementById("data-output");
            let out = "";

            // let uniqueNames = findUniqueValuesByKey(spells, "Casting time");
            // console.log([...uniqueNames]); 
            for (let i = 0; i < spells.length; i++) {
                let spellJSON = spells[i];
                let spell = new Spell(spellJSON);
                out += createTableRow(spell, i); 
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

            // events for rows, checkbox save and onclick description
            let rows = Array.from(table.querySelectorAll(`tr`));;
            rows = rows.slice(1);
            rows.forEach((tr, position) => {
                let checkbox = tr.querySelector('td:first-child input[type="checkbox"]');
                checkbox.addEventListener('change', evt => {
                    var checkboxName = checkbox.getAttribute('name');
                    if (checkbox.checked) {
                        tr.classList.add('checked')
                    } else {
                        tr.classList.remove('checked')
                    }
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

            window.addEventListener('scroll', function() {
                if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - window.screen.width * 0.3) {
                    let rows = document.querySelectorAll(".hidden-on-scroll");
                    for (let i = 0; i < rowsReveal && i < rows.length; i++) {
                        showRowsScrolling(rows[i]);
                    }
                    updateSpellCount()
                }
            });

            loadCheckboxStates()
            let filterValues = filterInputs.map((filter) => filter.value);
            filterTable(table, 0, filterValues)
            updateSpellCount()
        });
});

class Spell {
    constructor(spellData) {
        this.name = spellData.Name;
        this.linkAon = spellData["Url aon"];
        this.linkD20 = spellData["Url d20"];
        this.PFSLegal = spellData["PFS legal"] === true ? "✔" : " ";
        this.school = spellData.School;
        this.subschool = spellData.Subschool === "None" ? "" : spellData.Subschool;
        this.descriptors = spellData.Descriptors === "None" ? "" : spellData.Descriptors;
        this.effect = spellData.Effect === "None" ? "" : spellData.Effect;
        this.target = spellData.Target === "None" ? "" : spellData.Target;
        this.savingThrow = spellData["Saving throw"] === undefined ? "" : spellData["Saving throw"];
        this.spellResistance = spellData["Spell Resistance"] === undefined ? "" : spellData["Spell Resistance"];
        this.shortDescription = spellData["Short description"] === undefined ? "" : spellData["Short description"];
        this.fullDescription = spellData["Description"] === undefined ? "" : spellData["Description"];
        this.castingTime = spellData["Casting time"];
        this.components = spellData.Components;
        this.range = spellData.Range;
        this.duration = spellData.Duration;
        this.accessWays = "";
        
        this.overflows = "";
        this.checked = false;

        try {
            let result = Object.entries(spellData["access_ways"]).map(([key, value]) => {
                return value.map(item => {
                    return item.join(' ');
                }).join('\n');
            }).join('\n');
            this.accessWays = result;
        } catch (err) {
            // do nothing
            console.log(this.name)
        }
        if (countNewLines(this.accessWays) >= 3) {
            this.overflows = " overflows";
        }

        let parsedRange = parseRange(spellData.Range);
        this.rangeCode = parsedRange.code;
        this.rangeDistance = parsedRange.distance;
        this.parsedDuration = parseDuration(spellData.Duration);
    }
}

function createTableRow(spell, position) {
    return `
        <tr class="data-row displayed">
            <td><input type="checkbox" name="${spell.name}"/></td>
            <td linkAon="${spell.linkAon}" linkD20="${spell.linkD20}">${spell.name}</td>
            <td title="${spell.fullDescription}">${spell.shortDescription}</td>
            <td>${spell.school}</td>
            <td>${spell.subschool}</td>
            <td>${spell.descriptors}</td>
            <td class="access-td"><div class="access-div ${spell.overflows}" title="${spell.accessWays}">${spell.accessWays}</div></td>
            <td data-sort="${spell.castingTime}">${spell.castingTime}</td>
            <td>${spell.components}</td>
            <td data-sort-code="${spell.rangeCode}" data-sort-dist="${spell.rangeDistance}">${spell.range}</td>
            <td>${spell.effect}</td>
            <td>${spell.target}</td>
            <td data-sort="${spell.parsedDuration}">${spell.duration}</td>
            <td>${spell.savingThrow}</td>
            <td>${spell.spellResistance}</td>
            <td>${spell.PFSLegal}</td>                                    
        </tr>
    `;
}

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
    if ((nextRow === null && !tr.classList.contains('show-desc') && !tr.classList.contains('hidden-desc')) || 
        (!nextRow.classList.contains('show-desc') && !nextRow.classList.contains('hidden-desc'))) {
        let newRow = document.createElement('tr');
        let newCell = document.createElement('td');
        newCell.colSpan = "100";                            
        let fullDescription = tr.querySelector(`td:nth-child(${colIndex.get("Description")})`).getAttribute("title");
        if (preFormattedDescription.includes(tr.querySelector(`td:nth-child(${colIndex.get("Name")})`).innerText))
            fullDescription = "<pre>" + fullDescription + "</pre>"
        
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
        newRow.classList.add('show-desc');
        tr.parentNode.insertBefore(newRow, nextRow);
    } else {
        nextRow.classList.toggle('hidden-desc');
        nextRow.classList.toggle('show-desc');
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
        if (!prevRowChecked && (row.classList.contains('hidden-desc') || row.classList.contains('show-desc'))) {
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


function countUnfilteredRows(table) {
    let rows = table.querySelectorAll('tr');

    let unfilteredRowCount = 0;
    for (let i = 1; i < rows.length; i++) {
        // if (rows[i].style.display !== 'none') {
        if (!rows[i].classList.contains('hidden-on-filter') &&
            rows[i].classList.contains('data-row')) {
            unfilteredRowCount++;
        }
    }
    return unfilteredRowCount;
}

function countShownRows(table) {
    let rows = table.querySelectorAll('tr');

    let visibleRowCount = 0;
    for (let i = 1; i < rows.length; i++) {
        // if (rows[i].style.display !== 'none') {
        if (rows[i].classList.contains('displayed') &&
            rows[i].classList.contains('data-row')) {
            visibleRowCount++;
        }
    }
    return visibleRowCount;
}


function toggleTopFixedBar() {
    let topFixedBar = document.getElementById("top-bar");
    topFixedBar.classList.toggle('hidden');
    localStorage.setItem('topFixedBarVisibility', 
        topFixedBar.classList.contains('hidden'));
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
      var row = checkbox.closest('tr');
      if (checkboxState === 'true') {
        checkbox.checked = true;
        row.classList.add('checked');
      } else {
        checkbox.checked = false;
        row.classList.remove('checked');
      }
    });
  }

function updateSpellCount() {
    document.getElementById("spellcount").innerText = `${countUnfilteredRows(table)} spells (${countShownRows(table)} shown)`
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
