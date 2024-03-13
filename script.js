document.addEventListener("DOMContentLoaded", function () {
    fetch("spellList.json")
        .then(function (response) {
            
            return response.json();
        })
        .then(function (spells) {
            console.log(spells.length);
            let jsonPretty = JSON.stringify(spells, null, 2);
            console.log(jsonPretty)

            
            //result = spells.filter((spell) => spell["Name"].includes("Aram "));
            let placeholder = document.querySelector("#data-output");
            let out = "";
            for (let spell of spells) {
                let Subschool = spell.Subschool == "None" ? " " :spell.Subschool
                let Descriptors = spell.Descriptors == "None" ? " " :spell.Descriptors
                let Price = spell.Price == 0 ? " " : spell.Price
                let Effect = spell.Effect == "None" ? " " : spell.Effect
                let Target = spell.Target == "None" ? " ": spell.Target
                let SavingThrow = spell["Saving throw"] === undefined ? " " : spell["Saving throw"]
                let SpellResistance = spell["Spell Resistance"] === undefined ? " " : spell["Spell Resistance"]

                let access_ways = "";
                try {
                let result = Object.entries(spell["access_ways"]).map(([key, value]) => {
                    return value.map(item => {
                      return item.join(' ');
                    }).join('\n');
                  }).join('\n');
                //console.log(result)
                access_ways = result;
                } catch (err) {
                    console.error("Error: ", spell.Name)
                }
                out += `
                    <tr>
                        <td><div title="${spell.Description}">${spell.Name}</div></td>
                        <td>${spell.School}</td>
                        <td>${Subschool}</td>
                        <td>${Descriptors}</td>
                        <td style="white-space:pre-wrap; word-wrap:break-word">${access_ways}</td>
                        <td>${spell["Casting time"]}</td>
                        <td>${spell.Components}</td>
                        
                        <td>${spell.Range}</td>
                        <td>${Effect}</td>
                        <td>${Target}</td>
                        <td>${spell.Duration}</td>
                        <td>${SavingThrow}</td>
                        <td>${SpellResistance}</td>               
                    </tr>
                `;
            }

            placeholder.innerHTML = out;
        });
});
// <td>${Price}</td>
// <td><div title="${spell.Description}" class="description">${spell.Description}</div></td>
