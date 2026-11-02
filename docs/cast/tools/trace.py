import cv2, numpy as np, potrace, sys, json
scale=40;pad=3
def mask_for(name,thr=.42,sigma=2.2,minarea=60):
    im=cv2.imread(f'{name}.png'); g=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY).astype(np.float32)
    bg=cv2.GaussianBlur(cv2.morphologyEx(g,cv2.MORPH_CLOSE,np.ones((61,61))),(0,0),40)
    n=g/np.maximum(bg,1)
    n=cv2.GaussianBlur(n,(0,0),sigma)
    m=(n<thr).astype(np.uint8)
    # outside the box is the sheet's own printing
    x0=int((pad-0.7)*scale);x1=int((pad+40.7)*scale);y0=int((pad-0.9)*scale);y1=int((pad+47.2)*scale)
    keep=np.zeros_like(m);keep[y0:y1,x0:x1]=1;m&=keep
    cnt,l,st,_=cv2.connectedComponentsWithStats(m)
    for i in range(1,cnt):
        if st[i,4]<minarea: m[l==i]=0
    return m
def trace(m,turd=30,alpha=1.1,opt=.6):
    bm=potrace.Bitmap(m.astype(bool)); pl=bm.trace(turdsize=turd,alphamax=alpha,opttolerance=opt)
    d=[]
    f=lambda p:f'{p.x/scale-pad:.2f} {p.y/scale-pad:.2f}'
    for c in pl:
        d.append('M'+f(c.start_point))
        for s in c.segments:
            if s.is_corner: d.append('L'+f(s.c)+'L'+f(s.end_point))
            else: d.append('C'+f(s.c1)+' '+f(s.c2)+' '+f(s.end_point))
        d.append('Z')
    return ''.join(d)
if __name__=='__main__':
    out={}
    for n in ['hanta','paper','press','milk']:
        m=mask_for(n); cv2.imwrite(f'm-{n}.png',(1-m)*255); out[n]=trace(m); print(n,len(out[n]))
    json.dump(out,open('raw.json','w'))
    sheet=np.hstack([cv2.imread(f'm-{n}.png') for n in out]);cv2.imwrite('masks.jpg',cv2.resize(sheet,None,fx=.3,fy=.3,interpolation=cv2.INTER_AREA))
