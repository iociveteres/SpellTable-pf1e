# Pathfinder 1e Spell Table

This site allows user to view, sort and filter 3039 Pathfinder 1e spells.<br>
Hosted at: https://iociveteres.github.io/SpellTable-pf1e/

## Why, or how was it made like this?

I parsed aonprd and pfsrd long ago in 2022 and was thinking about site with interface where everything is at hand and not overloaded with a ton of submenus. I tried making this project with React, and was looking for a ready-made table with sorting and filtering, but never liked style, use of pagination or didn't understand how to use it with my quite complex data. Then, I came across a blog post about that you can make a site with just HTML, CSS, and vanilla JavaScript, and probably don't even need a front-end framework, and decided to try.<br><br>
To my surprise, implementing basic sorting and filtering was much easier than I anticipated. But I noticed it worked not quite as snappy as I wished to, and I couldn't really biggest problem rerendering all 3039 rows for every reload and action. I optimized the rendering so that only the first few rows would load initially, rendering additional rows as the user scrolled. However it didn't really work on mobile devices. I couldn't find what's wrong for several month (it was DPR, now I've learnt), and started working on functionality.<br><br>
I moved a large amount of information, for which there was no place in the table itself, to be displayed on a click in description row, made correct sorting based on values and not lexicography, added support for logical expressions for filtering (I have thought there should be a good lib for it, and was right, logipar is amazing, literally took 20 minutes of work). I've encountered some user experience problems with not firing click events when selecting text or pressing rmb, thrashing perfomance with filters when typing so debounce was added. Making a dark theme was a nobrainer, prefferably without any flashes of unstyled content, as was improving keyboard support. Then I made site percievably faster with loading prerendered rows for first 50 in html, and minorly optimised DOM manipulations moving from changing InnerHTML to use of proper functions. Then I noticed my descriptions look horrible and found proper css both to render whitespace and break new lines when there is not enough width, and if white space is supported, why not add console styled tables? With a bit of Python scripts, that are not included here now, I made tables and all other html markup pretty in mostly plain text. Very next day I understood I could have probably just use html tables there, but monospace looks far more stylish to me.<br><br>
Looking back, some of the challenges I faced would likely have been easier to manage using a front-end framework. Though, I would not use it for my future projects, trying to keep all complexity on back-end if possible.

## License

MIT License
