
# WORK

## UI TWEAKS
- CSS site definitions for hole bkg and rounding effects.
KEYBORD MAYBE USEFUL: https://codepen.io/evilpaper/pen/dyyZjLQ


- [ ] div modal-footer is black. the whole page should be rendered to look like our interface.



- [ ] expanding collapsed window seems to reset stored collapse state to small size (default) even when viz+sliders are present. or the collapsed window was resized to account for controls. any expansion of the panel seems to reset collapsed position and size
- [ ] trigger buttons on hotkey release not hotkey press for CMD-OPT hotkeys.



- [ ] have the css transitions for panel display use animations that make use of animation speed in settings. slide down like a drawer is nice...
- [ ] have the code mirror pane be a snugger fit to the lines of code (but minimum 3 lines), but grow as code is added

- [ ] top bar styling and master control panels in banner bar (target a specific container id)



UI STYLING REQUESTS
there is a top-bar list of buttons.  I would like the entire top-bar to only appear when the mouse is within 90px of the top of the page. Otherwise it is hidden. the top-bar shouldbe positioned absolute top of screen and animate up and down like a drawer from the top of the screen.

the BANNER bar itself should be aligned at the top of the screen too, and the topbar displays over the top of the banner bar as it appear.
I would like there to be a much narrower banner bar perhaps as little as 50px tall. I would like the colour of the banner bar and the top window fram in electron to be the same.
I would like a distinct area in the html for the top level master buttons.... this should be immediately under the banner-bar
Something like
[----disappearing top-bar----]
[----banner bar----]
[----metronome----]
[----master button block----]
all these positioned at the top of the page and then 
[-------panel tree view

   ---contains master Panel
   --- extra added intrument panels
-------]





why is base.css so large? can it be split? which parts of the UI are described there?
can we make a refactor for skins?


failures loading snippets or samples should NOT break the loading process...