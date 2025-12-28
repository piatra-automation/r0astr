
# WORK

## UI TWEAKS
- CSS site definitions for hole bkg and rounding effects.
KEYBORD MAYBE USEFUL: https://codepen.io/evilpaper/pen/dyyZjLQ


- [ ] div modal-footer is black. the whole page should be rendered to look like our interface.



- [ ] expanding collapsed window seems to reset stored collapse state to small size (default) even when viz+sliders are present. or the collapsed window was resized to account for controls. any expansion of the panel seems to reset collapsed position and size
- [ ] trigger buttons on hotkey release not hotkey press for CMD-OPT hotkeys.



- [ ] have the css transitions for panel display use animations that make use of animation speed in settings. slide down like a drawer is nice...



failures loading snippets or samples should NOT break the loading process...


- only some of the settings appear to be used. the codemirror font size is ok.
the projection margins also seem to still work well.
-tempo settings seem ok.
active and background panel opacity seems to be ignored
light dark mode settings ignored.
default panel width and panel height are now deprecated in tree view so can be removed from settings.



electron app name. html page title.


### Basic Audio Rendering
 - [x] `s("bd sd bd sd")` - OK
 - [x] `note("c e g c5").s("sawtooth")` - OK
 - [x] `s("piano:0 piano:4 piano:7")` - OK
 - [x] `s("bd").gain(slider(0.5, 0, 1))` - OK

 ### Pattern Functions
 - [x] `.fast(2)`, `.slow(2)` - OK
 - [x] `.lpf(slider(800, 100, 5000))` - OK
 - [x] `.room(0.9)` - OK
 - [x] `.every(4, fast(2))` - OK

 ### Multi-Pattern Control (May not work in r0astr)
 - [x] `all(fast(2))` - OK
 - [ERR] `each(gain(0.5))` -  Error: V is not a function (line unknown)
 - [x] `hush()` - OK
 - [ERR] `cpm(120)` - Error: Method '.p()' is not a function (line unknown)

 ### Advanced Features
 - [ERR] `s("bd").orbit(slider(0, 0, 7))` - Error: V is not a function (line unknown)
 - [ ] Multiple sliders in one pattern
 - [ERR] Pattern shortcuts: `d1`, `.p1`, `$:`, `_pattern` when I use a named pattern or anonymous pattern then clikcing stop in the panel doesnt stop play. only STOP ALL/HUSH works to staop playback for that panel 

