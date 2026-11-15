import json, re
TK='/tmp/tk/src/data/pages/torah'
OURS='/home/claude/hazzantrainer/src/data/torah'
BOOKS=['bereshit','shemot','vayikra','bamidbar','devarim']
letters=lambda s: re.sub(r'[^א-ת]','',s)
def pieces(w): return [p for p in w.split('־') if letters(p)]

ours=[]  # (book, verseIndex, tokenIndex, pieceIndex, consonants)
for bi,b in enumerate(BOOKS):
    for vi,vs in enumerate(json.load(open(f'{OURS}/{b}.json'))):
        for ti,t in enumerate(vs['t']):
            w = t['k'] if isinstance(t,dict) else t
            if not isinstance(t,dict) and w in ('|','_','¶p','¶s'): continue
            for pi,p in enumerate(pieces(w)):
                ours.append((bi,vi,ti,pi,letters(p)))
segs=[]; tw=[]
for col in range(1,246):
    d=json.load(open(f'{TK}/{col}.json'))
    for li,l in enumerate(d):
        flat=[s for part in l['text'] for s in part]
        for si,s in enumerate(flat):
            s=re.sub(r'#\([^)]*\)','',s)
            ws=[p for w in s.split() for p in pieces(w)]
            segs.append(dict(col=col,line=li,seg=si,n=len(ws),start=len(tw)))
            tw += [letters(p) for p in ws]
print('tk units',len(tw),'our units',len(ours))
# align
i=j=0; mis=[]; mapping={}  # tk index -> our index
while i<len(tw) and j<len(ours):
    if tw[i]==ours[j][4]:
        mapping[i]=j; i+=1; j+=1; continue
    mis.append((i,j,tw[i:i+3],[o[4] for o in ours[j:j+3]]))
    done=False
    for d in range(1,6):
        for di,dj in ((d,0),(0,d),(d,d)):
            if i+di+1<len(tw) and j+dj+1<len(ours) and tw[i+di]==ours[j+dj][4] and tw[i+di+1]==ours[j+dj+1][4]:
                for k in range(min(di,dj)): mapping[i+k]=j+k
                i+=di; j+=dj; done=True; break
        if done: break
    if not done: mapping[i]=j; i+=1; j+=1
print('mismatches',len(mis), 'end', i, j)
for m in mis[:40]: print(m)
json.dump(dict(segs=segs,mapping=mapping,ours=ours),open('align.json','w'))
