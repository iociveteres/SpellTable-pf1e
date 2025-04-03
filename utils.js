export const colIndex = new Map();
let thElements = Array.from(document.getElementById('table-spells').querySelectorAll('th'));
thElements.forEach((th, index) => {
    const innerText = th.innerText.trim();
    colIndex.set(innerText, index + 1);
});

export function divideChecked(rows) {
    let checkedRows = [];
    let uncheckedRows = [];
    let prevRowChecked = false;
    rows.forEach(row => {
        let checkbox = row.querySelector('td:first-child input[type="checkbox"]');
        if (checkbox && checkbox.checked) {
            checkedRows.push(row);
            prevRowChecked = true;
        } else if (prevRowChecked && (row.classList.contains('show-row') || row.classList.contains('hidden-row'))) {
            checkedRows.push(row);
            prevRowChecked = false;
        } else {
            uncheckedRows.push(row);
            prevRowChecked = false;
        }
    });

    return {checkedRows: checkedRows, uncheckedRows: uncheckedRows};
}

export function divideFilteredOut(table) {
    let filteredOutRows = table.querySelectorAll(".hidden-on-filter");
    let visibleRows = table.querySelectorAll("tr:not(.hidden-on-filter)");

    return {visibleRows: visibleRows, filteredOutRows: filteredOutRows};
}

export const rowsReveal = 50;

export function hideRowsFiltering(row) {
    row.classList.add('hidden-on-filter');
    row.classList.remove('displayed')
    row.classList.remove('hidden-on-scroll')
}

export function showRowsFiltering(row, position) {
    row.classList.remove('hidden-on-filter');
    if (position >= rowsReveal) {
        row.classList.add('hidden-on-scroll')
    } else {
        row.classList.add('displayed')
    }
}

export function showRowsScrolling(row) {
    if (row.classList.contains('data-row')) {
        row.classList.remove('hidden-on-scroll')
        row.classList.add('displayed')
    }
}

export function showRowsSorting(row) {
    if (row.classList.contains('data-row') &&
        !row.classList.contains('hidden-on-filter')) {
        row.classList.remove('hidden-on-scroll')
        row.classList.add('displayed')
    }
}

export function hideRowsSorting(row) {
    if (!row.classList.contains('hidden-on-filter')) {
        row.classList.remove('displayed')
        row.classList.add('hidden-on-scroll')
    }
}

export const timeUnits = new Map([
    ["free action", 1], 
    ["immediate action", 2], 
    ["swift action", 3], 
    ["move action", 4], 
    ["standard action", 5],
    ["full-round action", 6], 
    ["full round", 7], 
    ["round", 8], 
    ["minute", 9], 
    ["hour", 10], 
    ["day", 11], 
    ["week", 12],
    ["see", 13],
    ["special", 14]
]);

export const rangeUnits = new Map([
    ["personal", 0], 
    ["touch", 1], 
    ["close", 2], 
    ["medium", 3], 
    ["long", 4],
    ["ft.", 5], 
    ["feet", 5], 
    ["mile", 6], 
    ["hex", 7], 
    ["unlimited", 8], 
    ["see text", 9],
    ["", 10]
]);

export const durationUnits = new Map([
    ["instantaneous", 0], 
    ["concentration", 1], 
    [" round/level", 2], 
    [" round", 3], 
    [" minute/level", 4], 
    [" min./level", 4], 
    [" minute", 5], 
    [" minutes/level", 6], 
    [" min./level", 6], 
    [" minutes", 7], 
    [" hour/level", 8],
    [" hour", 9], 
    [" day/level", 10], 
    [" day", 11], 
    [" week/level", 12], 
    [" week", 13], 
    [" month", 14], 
    [" battle", 15], 
    ["until triggered", 16],
    ["permanent", 17], 
    ["see", 18],
    ["special", 19]
]);

export const SourceReleaseDates = new Map([
    ["Advanced Class Guide", "2015-08-14"],
    ["Advanced Class Origins", "2014-10-22"],
    ["Advanced Player's Guide", "2010-08-05"],
    ["Advanced Race Guide", "2012-06-20"],
    ["Adventurer's Armory 2", "2017-06-28"],
    ["Adventurer's Guide", "2017-05-24"],
    ["Agents of Evil", "2015-12-16"],
    ["Andoran, Spirit of Liberty", "2010-01-01"],
    ["Animal Archive", "2013-02-13"],
    ["Aquatic Adventures", "2017-06-01"],
    ["Arcane Anthology", "2016-01-27"],
    ["Armor Master's Handbook", "2016-04-27"],
    ["Black Markets", "2015-10-21"],
    ["Blood of Shadows", "2016-02-24"],
    ["Blood of the Ancients", "2018-05-30"],
    ["Blood of the Beast", "2016-11-16"],
    ["Blood of the Coven", "2017-10-18"],
    ["Blood of the Elements", "2014-06-25"],
    ["Blood of the Moon", "2013-10-21"],
    ["Blood of the Night", "2012-12-06"],
    ["Blood of the Sea", "2017-07-26"],
    ["Book of the Damned", "2017-09-27"],
    ["Book of the Damned - Volume 1:Princes of Darkness", "2009-10-01"],
    ["Book of the Damned - Volume 2:Lords of Chaos", "2010-12-01"],
    ["Book of the Damned - Volume 3:Horsemen of the Apocalypse", "2011-11-01"],
    ["Champions of Balance", "2014-03-25"],
    ["Champions of Corruption", "2014-09-10"],
    ["Champions of Purity", "2013-04-16"],
    ["Cheliax, Empire of Devils", "2009-08-01"],
    ["Chronicle of Legends", "2019-05-29"],
    ["Chronicle of the Righteous", "2013-05-01"],
    ["Cities of Golarion", "2009-11-01"],
    ["Classic Treasures Revisited", "2010-04-01"],
    ["Cohorts and Companions", "2015-05-27"],
    ["Conquest of Bloodsworn Vale", "2007-07-01"],
    ["Curse of the Crimson Throne (PFRPG)", "2016-10-01"],
    ["Dark Markets - A Guide to Katapesh", "2009-04-01"],
    ["Demon Hunter's Handbook", "2013-08-17"],
    ["Demons Revisited", "2013-08-01"],
    ["Dirty Tactics Toolbox", "2015-09-02"],
    ["Disciple's Doctrine", "2018-01-31"],
    ["Distant Realms", "2018-06-01"],
    ["Distant Worlds", "2012-02-01"],
    ["Divine Anthology", "2016-09-28"],
    ["Dragon Empires Primer", "2012-01-01"],
    ["Dragonslayer's Handbook", "2013-07-11"],
    ["Dungeon Denizens Revisited", "2009-05-01"],
    ["Dungeoneer's Handbook", "2013-03-08"],
    ["Dungeons of Golarion", "2011-07-01"],
    ["Dwarves of Golarion", "2009-12-01"],
    ["Elemental Master's Handbook", "2017-08-17"],
    ["Faction Guide", "2010-05-01"],
    ["Faiths and Philosophies", "2013-08-19"],
    ["Faiths of Balance", "2011-07-01"],
    ["Faiths of Corruption", "2011-10-01"],
    ["Faiths of Purity", "2011-04-01"],
    ["Familiar Folio", "2015-01-28"],
    ["GameMastery Condition Cards", "2011-05-01"],
    ["Giant Hunter's Handbook", "2014-12-17"],
    ["Gnomes of Golarion", "2010-05-01"],
    ["Goblins of Golarion", "2011-08-01"],
    ["Gods and Magic", "2008-10-01"],
    ["Guardians of Dragonfall", "2007-12-01"],
    ["Guide to the River Kingdoms", "2010-02-01"],
    ["Haunted Heroes Handbook", "2016-08-31"],
    ["Healer's Handbook", "2017-01-25"],
    ["Hell's Vengeance Player's Guide", "2016-02-25"],
    ["Heroes from the Fringe", "2018-08-29"],
    ["Heroes of the Darklands", "2017-04-26"],
    ["Heroes of the High Court", "2017-02-22"],
    ["Heroes of the Streets", "2015-09-30"],
    ["Heroes of the Wild", "2015-04-29"],
    ["Horror Adventures", "2016-08-04"],
    ["Humans of Golarion", "2011-06-01"],
    ["Inner Sea Gods", "2014-04-01"],
    ["Inner Sea Intrigue", "2016-05-01"],
    ["Inner Sea Magic", "2011-07-01"],
    ["Inner Sea Monster Codex", "2015-06-01"],
    ["Inner Sea Races", "2015-09-01"],
    ["Inner Sea Temples", "2016-10-01"],
    ["Inner Sea World Guide", "2011-03-01"],
    ["Knights of the Inner Sea", "2012-09-01"],
    ["Kobolds of Golarion", "2013-06-13"],
    ["Lands of the Linnorm Kings", "2011-10-01"],
    ["Legacy of Dragons", "2016-08-04"],
    ["Legacy of the First World", "2017-05-31"],
    ["Lost Kingdoms", "2012-06-01"],
    ["Magic Tactics Toolbox", "2016-05-25"],
    ["Magical Marketplace", "2013-12-11"],
    ["Melee Tactics Toolbox", "2015-03-25"],
    ["Monster Codex", "2014-10-22"],
    ["Monster Hunter's Handbook", "2017-03-29"],
    ["Monster Summoner's Handbook", "2015-06-24"],
    ["Mythic Adventures", "2013-08-14"],
    ["Mythic Origins", "2013-09-25"],
    ["Occult Adventures", "2015-07-29"],
    ["Occult Mysteries", "2014-05-01"],
    ["Occult Origins", "2015-10-21"],
    ["Occult Realms", "2015-11-01"],
    ["Orcs of Golarion", "2010-08-01"],
    ["Osirion, Land of the Pharaohs", "2008-12-01"],
    ["Osirion, Legacy of the Pharaohs", "2014-09-01"],
    ["PRPG Core Rulebook", "2009-08-13"],
    ["Paizo Blog - Ultimate Cantrips", "2011-05-24"],
    ["Path of the Hellknight", "2016-06-01"],
    ["Pathfinder #102:Breaking the Bones of Hell", "2016-01-01"],
    ["Pathfinder #107:Scourge of the Godclaw", "2016-06-01"],
    ["Pathfinder #110:The Thrushmoor Terror", "2016-09-01"],
    ["Pathfinder #113:What Grows Within", "2017-01-01"],
    ["Pathfinder #115:Trail of the Hunted", "2017-03-01"],
    ["Pathfinder #116:Fangs of War", "2017-03-01"],
    ["Pathfinder #117:Assault on Longshadow", "2017-04-01"],
    ["Pathfinder #119:Prisoners of the Blight", "2017-06-01"],
    ["Pathfinder #131:The Reaper's Right Hand", "2018-06-01"],
    ["Pathfinder #134:It Came from Hollow Mountain", "2018-09-01"],
    ["Pathfinder #135:Runeplague", "2018-10-01"],
    ["Pathfinder #140:Eulogy for Roslar's Coffer", "2019-03-01"],
    ["Pathfinder #143:Borne by the Sun's Grace", "2019-06-01"],
    ["Pathfinder #14:Children of the Void", "2008-09-01"],
    ["Pathfinder #16:Endless Night", "2008-11-01"],
    ["Pathfinder #17:A Memory of Darkness", "2008-12-01"],
    ["Pathfinder #19:Howl of the Carrion King", "2009-03-01"],
    ["Pathfinder #23:The Impossible Eye", "2009-06-01"],
    ["Pathfinder #24:The Final Wish", "2009-07-01"],
    ["Pathfinder #26:The Sixfold Trial", "2009-09-01"],
    ["Pathfinder #29:Mother of Flies", "2010-01-01"],
    ["Pathfinder #2:The Skinsaw Murders", "2007-09-01"],
    ["Pathfinder #30:The Twice-Damned Prince", "2010-01-01"],
    ["Pathfinder #32:Rivers Run Red", "2010-04-01"],
    ["Pathfinder #35:War of the River Kings", "2010-07-01"],
    ["Pathfinder #38:Racing to Ruin", "2010-09-01"],
    ["Pathfinder #41:The Thousand Fangs Below", "2011-01-01"],
    ["Pathfinder #42:Sanctum of the Serpent God", "2011-02-01"],
    ["Pathfinder #44:Trial of the Beast", "2011-04-01"],
    ["Pathfinder #50:Night of Frozen Shadows", "2011-09-01"],
    ["Pathfinder #53:Tide of Honor", "2012-01-01"],
    ["Pathfinder #55:The Wormwood Mutiny", "2012-02-01"],
    ["Pathfinder #56:Raiders of the Fever Sea", "2012-03-01"],
    ["Pathfinder #59:The Price of Infamy", "2012-06-01"],
    ["Pathfinder #5:Sins of the Saviors", "2007-12-01"],
    ["Pathfinder #62:Curse of the Lady's Light", "2012-09-01"],
    ["Pathfinder #64:Beyond the Doomsday Door", "2012-11-01"],
    ["Pathfinder #65:Into the Nightmare Rift", "2012-12-01"],
    ["Pathfinder #67:The Snows of Summer", "2013-02-01"],
    ["Pathfinder #68:The Shackled Hut", "2013-03-01"],
    ["Pathfinder #69:Maiden, Mother, Crone", "2013-04-01"],
    ["Pathfinder #71:Rasputin Must Die!", "2013-06-01"],
    ["Pathfinder #74:Sword of Valor", "2013-09-01"],
    ["Pathfinder #77:Herald of the Ivory Labyrinth", "2014-01-01"],
    ["Pathfinder #78:City of Locusts", "2014-02-01"],
    ["Pathfinder #80:Empty Graves", "2014-04-01"],
    ["Pathfinder #81:Shifting Sands", "2014-05-01"],
    ["Pathfinder #82:Secrets of the Sphinx", "2014-06-01"],
    ["Pathfinder #84:Pyramid of the Sky Pharaoh", "2014-07-01"],
    ["Pathfinder #86:Lords of Rust", "2014-09-01"],
    ["Pathfinder #89:Palace of Fallen Stars", "2014-12-01"],
    ["Pathfinder #8:Seven Days to the Grave", "2008-03-01"],
    ["Pathfinder #91:Battle of Bloodmarch Hills", "2015-02-01"],
    ["Pathfinder #93:Forge of the Giant God", "2015-05-01"],
    ["Pathfinder #95:Anvil of Fire", "2015-06-01"],
    ["Pathfinder #99:Dance of the Damned", "2015-10-01"],
    ["Pathfinder Campaign Setting", "2008-08-01"],
    ["Pathfinder Comics #10", "2013-10-23"],
    ["Pathfinder Comics #5", "2013-02-13"],
    ["Pathfinder Society Field Guide", "2011-07-01"],
    ["Pathfinder Society Primer", "2013-07-11"],
    ["Pathfinder Society Scenario #3-09: The Quest for Perfection—Part I: The Edge of Heaven", "2011-09-01"],
    ["Paths of the Righteous", "2016-12-14"],
    ["People of the North", "2013-01-22"],
    ["People of the River", "2014-07-25"],
    ["People of the Sands", "2014-01-09"],
    ["People of the Stars", "2014-08-14"],
    ["People of the Wastes", "2017-11-15"],
    ["Pirates of the Inner Sea", "2012-02-01"],
    ["Planar Adventures", "2018-06-27"],
    ["Plane-Hopper's Handbook", "2018-09-19"],
    ["Planes of Power", "2016-09-01"],
    ["Potions and Poisons", "2017-12-13"],
    ["Psychic Anthology", "2017-02-22"],
    ["Qadira, Jewel of the East", "2017-01-01"],
    ["Quests and Campaigns", "2013-06-13"],
    ["Ranged Tactics Toolbox", "2014-11-24"],
    ["Rise of the Runelords Anniversary Edition", "2012-07-01"],
    ["Rival Guide", "2011-05-01"],
    ["Sargava, the Lost Colony", "2010-06-01"],
    ["Second Darkness Player's Guide", "2008-08-01"],
    ["Seekers of Secrets", "2009-10-01"],
    ["SeveranceSource Faiths and Philosophies", "2013-08-19"],
    ["Spymaster's Handbook", "2016-06-29"],
    ["Taldor, Echoes of Glory", "2009-04-01"],
    ["Technology Guide", "2014-08-01"],
    ["The Dragon's Demand", "2013-07-01"],
    ["The First World, Realm of the Fey", "2016-12-01"],
    ["The Harrow Handbook", "2014-05-28"],
    ["Ultimate Combat", "2011-08-04"],
    ["Ultimate Intrigue", "2016-03-30"],
    ["Ultimate Magic", "2011-05-08"],
    ["Ultimate Wilderness", "2017-11-15"],
    ["Undead Slayer's Handbook", "2014-04-30"],
    ["Villain Codex", "2016-11-16"],
    ["Wilderness Origins", "2019-01-30"]
]);
