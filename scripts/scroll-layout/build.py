import json, re
A=json.load(open('align.json')); segs=A['segs']; mp={int(k):v for k,v in A['mapping'].items()}; ours=A['ours']
TK='/tmp/tk/src/data/pages/torah'
cols=[]
si=0
total_units=len(ours)
for col in range(1,246):
    d=json.load(open(f'{TK}/{col}.json'))
    lines=[]
    for li,l in enumerate(d):
        flat=[s for part in l['text'] for s in part]
        out=[]
        for k in range(len(flat)):
            s=segs[si]; si+=1
            assert s['col']==col and s['line']==li
            if s['n']==0: out.append(None); continue
            a=mp[s['start']]
            nxt=s['start']+s['n']
            b=mp[nxt] if nxt in mp else total_units
            o=ours[a]
            out.append([o[0],o[1],o[2],o[3],b-a])
        line={'s':out}
        if l['isPetucha']: line['p']=1
        if len(l['text'])>1: line['song']=1
        lines.append(line)
    cols.append(lines)
# sanity: units covered exactly once in order
cnt=sum(seg[4] for c in cols for l in c for seg in l['s'] if seg)
print('units covered', cnt, 'of', total_units)
empty=sum(1 for c in cols for l in c if not any(l['s']))
print('empty lines', empty)
json.dump(cols, open('/home/claude/hazzantrainer/src/data/scroll-layout.json','w'), ensure_ascii=False, separators=(',',':'))
import os; print(os.path.getsize('/home/claude/hazzantrainer/src/data/scroll-layout.json'))
