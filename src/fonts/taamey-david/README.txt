"Taamey David CLM" id based on "Davud CLM" with addition
of support for cantillation marks (Taamim) positioning.
Since the font supports cantillation marks positioning, 
the line spacing is wider then in the "David CLM" so as
to leave space for all marks.
Yoram Gnat

The fontforge sources are in the SFD folder. The fonts
themselves, in .ttf format, are in the TTF folders.

The "Taamey David" medium and Oblique varians fully (almost) support
Hebrew vowels and cantillation marks (Niqud and Taamim) positioning.
In the Bold variants the cantillation marks (Taamim) were made transparent,
thus text including them should still be displayed with proper 
positioning of the niqud.

The Samples folder includes the following files 
Letters_with_vowels.pdf   -  Shows combinations of vowels with the letters 
test.pdf                  -  Shows some special cases of mark positioning
Bereshit.pdf              -  Genesis chapter 1 written with the font
Tehilim.pdf               -  Psalms chapter 1 written with the font

To correctly display text with cantillation marks one should keep the
following typing order:
    Base Letter (consonant)
    Shin/Sin dot
    Dagesh/Rafe
    Niqud (vowel sign)
    Lower cantillation marks
    Upper cantillatio marks.

See the file test.pdf for the treatement of meteg (siluq).

Well, like with all rules, there are exception. 
To properely position the lower right marks - yetiv and dehi,
they should be typed before vowel marks, meteg and any other cantillation
marks.

Of course you will need a keyboard map that supports cantillation marks.
The Tiro keyboard available at
http://www.sbl-site.org/educational/BiblicalFonts_SBLHebrew.aspx
can be used for Windows and OS/X. A keyboard layout based on Tiro
is available in most Linux distributions.


---
Keriah Trainer change (Nov 22, 2026): the shin and sin dots were made bigger and higher, and each dot
glyph now carries its own place over the shin (right arm / left arm), so the dots never melt into the
letter and a renderer that skips the font's ccmp ligature still puts them on the right side.
Made by scripts/fonts/fix_shin_dots.py (run it on the original files only, once).
