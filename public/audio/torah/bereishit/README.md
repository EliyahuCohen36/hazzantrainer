Only the three demo recordings (sof-pasuk, atnah, tarha) live here, so the
free demo at /demo/ works for everyone.

All other recordings are in the private "recordings" bucket in Supabase
(same path without "/audio/", e.g. teamim/torah/zarka.mp3) and are only
played to signed-in users with an active licence. To add one: process it
(trim silence, loudnorm I=-18, MP3 128k mono), list it in
src/data/teamim-recordings.ts, then upload it from the Admin page
(Recordings → "upload file" next to it). Don't commit it here: the repo is public.
