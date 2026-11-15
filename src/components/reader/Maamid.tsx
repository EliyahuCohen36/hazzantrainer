import { Fragment } from "react";

const METEG = "ֽ";
const isLetter = (c: string) => c >= "א" && c <= "ת";

/**
 * Hebrew text with each ma'amid (meteg / silluq, U+05BD: the small line under a
 * letter) drawn clearly. Fonts draw it as a hair-thin stroke beside the vowel
 * that's easy to miss, and it tells the reader which letter takes the sound
 * (e.g. the Sof Pasuk). So the letter is wrapped and the line is drawn by CSS
 * (.maamid in globals.css) under it instead.
 */
export function WithMaamid({ text }: { text: string }) {
  if (!text.includes(METEG)) return <>{text}</>;
  const chars = [...text];
  const out: React.ReactNode[] = [];
  let plain = "";
  let i = 0;
  while (i < chars.length) {
    if (!isLetter(chars[i])) {
      plain += chars[i++];
      continue;
    }
    // A letter and the marks that follow it.
    let j = i + 1;
    while (j < chars.length && !isLetter(chars[j]) && chars[j] >= "֑" && chars[j] <= "ׇ" && chars[j] !== "־" && chars[j] !== "׀" && chars[j] !== "׃") j++;
    const cluster = chars.slice(i, j).join("");
    if (cluster.includes(METEG)) {
      if (plain) out.push(<Fragment key={out.length}>{plain}</Fragment>);
      plain = "";
      out.push(
        <span key={out.length} className="maamid" title="Ma'amid: the sound goes on this letter">
          {cluster.replace(METEG, "")}
        </span>,
      );
    } else plain += cluster;
    i = j;
  }
  if (plain) out.push(<Fragment key={out.length}>{plain}</Fragment>);
  return <>{out}</>;
}
