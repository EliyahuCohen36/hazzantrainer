"""Builds src/data/tanakh/*.json (Nevi'im and Ketuvim) from MAM-simple.

Run: MAM_SIMPLE=<path to MAM-basics/MAM-simple/> python3 scripts/tanakh-text/build.py
The verse converter is the same one used for the Torah files.
"""
import json, re, sys
import os
BASE=os.environ.get('MAM_SIMPLE','/home/claude/w/MAM-basics/MAM-simple/')
LG_S,LG_E,SM_S,SM_E='','','',''
HG_S,HG_E='\ue030','\ue031'
PASEQ,SHIRAH,INVNUN='','',''
SEPH=re.compile(r'^בספרי ספרד (?:ואשכנז|ורוב ספרי אשכנז) (\S+)$')
log=[]
def plain(x):
    if isinstance(x,str): return x
    if isinstance(x,dict):
        if 'text' in x and 'contents' not in x: return x['text']
        return ''.join(plain(c) for c in x.get('contents',[]))
    return ''
def conv_verse(vx, side):
    out=[]
    def emit(x):
        t=x.get('type')
        if t in (None,'text','kq-trivial'): out.append(x.get('text',''))
        elif t=='verse':
            if 'text' in x: out.append(x['text'])
            for c in x.get('contents',[]): emit(c)
        elif t=='slh-word':
            for c in x['contents']: emit(c)
        elif t=='letter-large': out.append(LG_S+x['text']+LG_E)
        elif t=='letter-small': out.append(SM_S+x['text']+SM_E)
        elif t=='letter-hung': out.append(HG_S+x['text']+HG_E)
        elif t in ('lp-paseq','lp-legarmeih'): out.append(' '+PASEQ+' ')
        elif t=='shirah-space': out.append(' '+SHIRAH+' ')
        elif t=='spi-invnun': out.append(' '+INVNUN+' ')
        elif t in ('spi-pe2','spi-pe3'): out.append(' p ')
        elif t in ('spi-samekh2','spi-samekh3'): out.append(' s ')
        elif t=='kq':
            c={y['type']:plain(y) for y in x['contents']}
            k=c.get('kq-k',c.get('kq-k-velo-q','')); q=c.get('kq-q',c.get('kq-q-velo-k',''))
            side.append({'k':k,'q':q}); out.append(('\ue020%d' if (k and q) else ' \ue020%d ')%(len(side)-1))
        elif t=='kq-q-velo-k':
            side.append({'k':'','q':x['text']}); out.append(' \ue020%d '%(len(side)-1))
        elif t=='kq-k-velo-q':
            side.append({'k':x['text'],'q':''}); out.append(' \ue020%d '%(len(side)-1))
        elif t=='silluq-before-meteg': out.append(x['text'])
        elif t=='implicit-maqaf': out.append(' ')
        elif t in ('kq-k-velo-q-maq','good-ending'): pass
        elif t=='cant-all-three':
            c={y['type']:y for y in x['contents']}
            cb=c['cant-bet']
            if 'contents' in cb:
                for ch in cb['contents']: emit(ch)
            else: out.append(cb['text'])
        elif t=='scrdfftar':
            c={y['type']:y for y in x['contents']}
            target=plain(c['sdt-target']); note=plain(c['sdt-note'])
            m=SEPH.match(note)
            if m and target.strip():
                log.append((vx['osisID'],target,'->',m.group(1)))
                out.append(m.group(1))
            else:
                out.append(target)
                if note.startswith('אין פרשה בספרי ספרד'): side.append('NOBREAK')
        else:
            raise SystemExit('unknown '+str(t)+' in '+vx['osisID'])
    emit({'type':'verse','contents':vx.get('contents',[]), **({'text':vx['text']} if 'text' in vx else {})})
    s=''.join(out)
    toks=[]
    for w in s.split():
        if w==PASEQ: toks.append('|')
        elif w==SHIRAH: toks.append('_')
        elif w==INVNUN: toks.append('׆')
        elif w in ('p','s'): toks.append('¶'+w[1])
        elif '\ue020' in w:
            m=re.match('^(.*)\ue020(\\d+)(.*)$',w); kq=side[int(m.group(2))]; toks.append({'k':m.group(1)+kq['k']+m.group(3),'q':m.group(1)+kq['q']+m.group(3)})
        else:
            toks.append(w.replace(LG_S,'{').replace(LG_E,'}').replace(SM_S,'[').replace(SM_E,']').replace(HG_S,'<').replace(HG_E,'>'))
    return toks

# Nevi'im and Ketuvim: one JSON per book of our list; combined books keep each part (s = part index).
BOOKS = {
  'yehoshua': ['Josh'], 'shofetim': ['Judg'], 'shemuel': ['1Sam-2Sam'], 'melakhim': ['1Kgs-2Kgs'],
  'yeshayahu': ['Isa'], 'yirmeyahu': ['Jer'], 'yehezkel': ['Ezek'], 'tere-asar': ['Hos-Mal'],
  'tehillim': ['Ps'], 'mishle': ['Prov'], 'iyov': ['Job'], 'shir-hashirim': ['Song'], 'ruth': ['Ruth'],
  'eikha': ['Lam'], 'kohelet': ['Eccl'], 'ester': ['Esth'], 'daniel': ['Dan'], 'ezra-nehemia': ['Ezra-Neh'],
  'divre-hayamim': ['1Chr-2Chr'],
}
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'data', 'tanakh')
parts_of = {}
for book, files in BOOKS.items():
    verses = []; parts = []
    for f in files:
        d = json.load(open(BASE + 'json-vtrad-mam/' + f + '.json'))
        def walk(x):
            if isinstance(x, dict):
                if x.get('type') == 'verse':
                    side = []
                    toks = conv_verse(x, side)
                    osis, c, v = x['osisID'].split('.')
                    if osis not in parts: parts.append(osis)
                    rec = {'c': int(c), 'v': int(v), 't': toks}
                    if len(files) > 1 or '-' in f: rec['s'] = parts.index(osis)
                    if x.get('ends-with-sampe'): rec['br'] = x['ends-with-sampe'][0]
                    if x.get('starts-with-sampe') and verses and 'br' not in verses[-1]:
                        verses[-1]['br'] = x['starts-with-sampe'][0]
                    verses.append(rec); return
                for v in x.values(): walk(v)
            elif isinstance(x, list):
                for v in x: walk(v)
        walk(d)
    if len(parts) == 1:
        for r in verses: r.pop('s', None)
    json.dump(verses, open(os.path.join(OUT, book + '.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
    # chapters per part
    ch = {}
    for r in verses:
        ch.setdefault(r.get('s', 0), {}); ch[r.get('s', 0)][r['c']] = ch[r.get('s', 0)].get(r['c'], 0) + 1
    parts_of[book] = [{'osis': p, 'chapters': [ch[i][c] for c in sorted(ch[i])]} for i, p in enumerate(parts)]
    print(book, len(verses), parts)
json.dump(parts_of, open(os.path.join(OUT, 'chapters.json'), 'w'), separators=(',', ':'))
for l in log: print(*l)
