import { sortTable } from './sort.js'
import { filterTable } from './filter.js';
import { colIndex, showRowsScrolling, rowsReveal, 
         timeUnits, rangeUnits, durationUnits } from './utils.js';

const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
{
    document.querySelector("body").classList.remove("notransition");
}

let themeToggleBtn = document.querySelector("#toggle-darkmode");
themeToggleBtn.addEventListener("click", function() {    
    if (prefersDarkScheme.matches) {
        document.documentElement.classList.toggle("light-mode");
        var theme = document.documentElement.classList.contains("light-mode") ? "light" : "dark";
    } else {
        document.documentElement.classList.toggle("dark-mode");
        var theme = document.documentElement.classList.contains("dark-mode") ? "dark" : "light";
    }
    localStorage.setItem("theme", theme);
    // console.log("switched to " + theme)
});

let table = document.getElementById('table-spells')

{
    let topFixedBar = document.getElementById("top-bar");
    let topFixedBarVisibility = localStorage.getItem('topFixedBarVisibility');
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
    updateSpellCount()
})

document.getElementById('unpin-all').addEventListener("click", evt => {
    unpinAll()
})

window.onbeforeunload = function () {
    window.scrollTo(0, 0);
  }

// fix col width
let thElements = table.querySelectorAll('th');
let widthMap = [];
thElements.forEach(header => {
    widthMap.push(header.offsetWidth + 'px');
});
thElements.forEach((header, index) => {
    header.style.width = widthMap[index];
});
table.style.tableLayout = 'fixed';


document.addEventListener("DOMContentLoaded", function () {
    fetch("spellList.json")
        .then(function (response) {
            return response.json();
        })
        .then(function (spells) {
            // console.log(spells.length);
            // console.time('parse')
            let out = "";

            // let uniqueNames = findUniqueValuesByKey(spells, "Casting time");
            // console.log([...uniqueNames]); 
            for (let i = 50; i < spells.length; i++) {
                let spellJSON = spells[i];
                let spell = new Spell(spellJSON);
                out += createTableRow(spell, i);
            }
            const placeholderElement = document.getElementById('placeholder');
            if (placeholderElement) {
                placeholderElement.remove(); 
            }
            const tbody = table.querySelector('tbody');
            tbody.insertAdjacentHTML("beforeend", out);
            // console.timeEnd('parse')
            
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

            table.addEventListener("change", (evt) => {
                if (evt.target.matches('td:first-child input[type="checkbox"]')) {
                    const checkbox = evt.target;
                    const checkboxName = checkbox.getAttribute("name");
                    localStorage.setItem(checkboxName, checkbox.checked);
                }
            });
            
            let clickStartTime = null;
            tbody.addEventListener("mousedown", (evt) => {
                const tr = evt.target.closest("tr");
                if (!tr || evt.button !== 0 || evt.target.closest("td:first-child")) return;
            
                clickStartTime = Date.now();
            });
            
            tbody.addEventListener("mouseup", (evt) => {
                const tr = evt.target.closest("tr");
                if (!tr || evt.button !== 0 || clickStartTime === null) return;
            
                const clickDuration = Date.now() - clickStartTime;
                if (clickDuration < 300) {
                    makeDescriptionRow(tr);
                }
                clickStartTime = null;
            });

            tbody.addEventListener("keydown", (evt) => {
                if (evt.key === "Enter") {
                    const tr = evt.target.closest("tr");
                    if (tr) {
                        makeDescriptionRow(tr);
                    }
                }
            });

            window.addEventListener('scroll', function() {
                if ((window.innerHeight * window.devicePixelRatio + window.scrollY) >= 
                    document.body.offsetHeight - window.screen.height * 0.3 * window.devicePixelRatio) {
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
        this.source = spellData.Source ===  "None" ? "" : spellData.Source;
        this.mythicSource = spellData["Mythic Source"] === undefined ? "" : spellData["Mythic Source"]
        this.mythicDescription = spellData["Mythic"] === undefined ? "" : spellData["Mythic"]
        this.castingTime = spellData["Casting time"];
        this.components = spellData.Components;
        this.price = spellData.Price === undefined ? "" : spellData.Price
        this.range = spellData.Range;
        this.duration = spellData.Duration;
        this.accessWays = "";
        
        this.overflows = "";
        this.checked = false;

        let result = Object.entries(spellData["access_ways"]).map(([key, value]) => {
            return value.map(item => item.join(' ')).join('\n');
        }).join('\n');
        this.accessWays = result;
        let resultWithSources = Object.entries(spellData["access_ways"]).map(([key, value]) => {
            let items = value.map(item => item.join(' ')).join('\n');
            return `${key}:\n${items}`;
          }).join('\n\n');
        this.accessWaysWithSources = resultWithSources
       
        if (countNewLines(this.accessWays) >= 3) {
            this.overflows = " overflows";
        }

        this.parsedCastTime = parseTime(spellData["Casting time"])
        let parsedRange = parseRange(spellData.Range);
        this.rangeCode = parsedRange.code;
        this.rangeDistance = parsedRange.distance;
        this.parsedDuration = parseDuration(spellData.Duration);
    }
}

function createTableRow(spell, position) {
    let mythic = "";
    if (spell.mythicDescription != "") {
        mythic = ` mythic-description = "${spell.mythicDescription}" mythic-source = "${spell.mythicSource}"`
    }
    return `<tr class="data-row hidden-on-scroll" tabindex="0">
                <td><input type="checkbox" name="${spell.name}"/></td>
                <td linkAon="${spell.linkAon}" linkD20="${spell.linkD20}">${spell.name}</td>
                <td title="${spell.fullDescription}" source="${spell.source}"${mythic}>${spell.shortDescription}</td>
                <td>${spell.school}</td>
                <td>${spell.subschool}</td>
                <td>${spell.descriptors}</td>
                <td class="access-td"><div class="access-div ${spell.overflows}" title="${spell.accessWaysWithSources}">${spell.accessWays}</div></td>
                <td data-sort="${spell.parsedCastTime}">${spell.castingTime}</td>
                <td price="${spell.price}">${spell.components}</td>
                <td data-sort-code="${spell.rangeCode}" data-sort-dist="${spell.rangeDistance}">${spell.range}</td>
                <td>${spell.effect}</td>
                <td>${spell.target}</td>
                <td data-sort="${spell.parsedDuration}">${spell.duration}</td>
                <td>${spell.savingThrow}</td>
                <td>${spell.spellResistance}</td>
                <td>${spell.PFSLegal}</td>                                    
            </tr>`;
}


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
        newCell.colSpan = "16";
        let td = tr.querySelector(`td:nth-child(${colIndex.get("Description")})`);
        let fullDescription = td.getAttribute("title");
        if (!fullDescription.endsWith("\n")) 
            fullDescription += '\n'
        fullDescription += '\n' + td.getAttribute("source");
        if (td && td.hasAttribute("mythic-description")) {
            if (!fullDescription.endsWith("\n")) 
            fullDescription += '\n'
            fullDescription += '\n<b>Mythic:</b>\n' + td.getAttribute("mythic-description");
            if (!fullDescription.endsWith("\n")) 
                fullDescription += '\n'
            fullDescription += '\n' + td.getAttribute("mythic-source");       
        }

        let accessWays = tr.querySelector(`.access-div`).getAttribute('title').replace("...", "");
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
            <div class="dropdown-description">${fullDescription}</div>
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
    var inputFields = document.querySelectorAll('table input[type="text"]');
    inputFields.forEach(function(input) {
        input.value = '';
    });
}


function unpinAll() {
    let checkboxes = document.querySelectorAll('td:first-child input[type="checkbox"]:checked');
    if (checkboxes == null) {
        return
    }
    let event = new Event("change", {bubbles: true});
    checkboxes.forEach(function(checkbox) {
        checkbox.checked = false;
        checkbox.dispatchEvent(event)
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
      } else {
        checkbox.checked = false;
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
