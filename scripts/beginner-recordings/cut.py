"""Cut one of the Hazzan's letter recordings into the Beginner Keriah clips.

A letter recording is: name, sound alone, a, e, i, o, u (Alef and He: no sound
alone), with a pause between each. Usage:

  python3 cut.py <recording> <letterId> [outdir]

Tries a few silence levels until it finds exactly the expected number of parts,
then writes letter-<id>.mp3, <id>-alone.mp3, <id>-qamats.mp3 … <id>-qibbus.mp3
(trimmed, loudness -18 LUFS, MP3 128k mono).
"""
import re, subprocess, sys, pathlib

SOUNDS = ["qamats", "sere", "hireq", "holem", "qibbus"]
SILENT_ALONE = {"alef", "he"}


def parts(src, noise, dur):
    log = subprocess.run(["ffmpeg", "-hide_banner", "-i", src, "-af", f"silencedetect=noise={noise}dB:d={dur}", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    total = float(re.search(r"Duration: (\d+):(\d+):([\d.]+)", log).groups()[2]) + 60 * int(re.search(r"Duration: (\d+):(\d+)", log).group(2))
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    edges, t = [], 0.0
    for s, e in zip(starts, ends + [total] * (len(starts) - len(ends))):
        if s - t > 0.12:
            edges.append((t, s))
        t = e
    if total - t > 0.12:
        edges.append((t, total))
    return edges


def main():
    src, lid = sys.argv[1], sys.argv[2]
    out = pathlib.Path(sys.argv[3] if len(sys.argv) > 3 else ".")
    out.mkdir(parents=True, exist_ok=True)
    names = [f"letter-{lid}"] + ([] if lid in SILENT_ALONE else [f"{lid}-alone"]) + [f"{lid}-{s}" for s in SOUNDS]
    for noise in (-35, -30, -40, -27, -45):
        for dur in (0.3, 0.25, 0.4, 0.2):
            segs = parts(src, noise, dur)
            if len(segs) == len(names):
                break
        if len(segs) == len(names):
            break
    else:
        sys.exit(f"{src}: found {len(segs)} parts, expected {len(names)}")
    for (a, b), name in zip(segs, names):
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-ss", f"{max(0, a - 0.1):.3f}", "-to", f"{b + 0.12:.3f}",
                        "-af", "adelay=40,apad=pad_dur=0.1,loudnorm=I=-18:TP=-1.5", "-ar", "44100", "-ac", "1", "-b:a", "128k",
                        str(out / f"{name}.mp3")], check=True)
        print(f"{name}.mp3  {a:.2f}-{b:.2f}s")


main()
