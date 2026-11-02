import cv2, numpy as np, sys
S=sys.argv[1]
im=cv2.imread(S+'/full.jpg'); h,w=im.shape[:2]; f=w/1200; print(w,h)
# corner squares read from the 1200-wide view, as approximate centers; refined by finding the dark blob nearby
boxes={'paper':[(134,298),(549,317),(126,782),(545,787)],
'hanta':[(731,323),(1124,330),(728,789),(1125,794)],
'press':[(125,825),(545,829),(100,1334),(539,1328)],
'milk':[(728,829),(1127,835),(731,1326),(1143,1321)]}
gray=cv2.cvtColor(im,cv2.COLOR_BGR2GRAY)
M=1.2;mk=1;W=40;H=47;scale=40
for name,pts in boxes.items():
    src=[]
    for (x,y) in pts:
        cx,cy=int(x*f),int(y*f);r=40
        roi=gray[max(cy-r,0):cy+r,max(cx-r,0):cx+r]
        t=(roi<85).astype(np.uint8)
        n,l,st,c=cv2.connectedComponentsWithStats(t)
        best=max(range(1,n),key=lambda i:st[i,4]) if n>1 else None
        c0=c[best]+[max(cx-r,0),max(cy-r,0)]
        src.append(c0); print(name,(x,y),np.round(c0/f,1),st[best,4])
    # centers of squares in rig units
    a=-M+mk/2;bx=W+M-mk/2;by=H+M-mk/2
    dst=np.float32([[a,a],[bx,a],[a,by],[bx,by]])
    pad=3
    dst=(dst+pad)*scale
    T=cv2.getPerspectiveTransform(np.float32(src),dst)
    out=cv2.warpPerspective(im,T,(int((W+2*pad)*scale),int((H+2*pad)*scale)),flags=cv2.INTER_CUBIC,borderValue=(255,255,255))
    cv2.imwrite(f'{S}/{name}.png',out)
sheet=np.hstack([cv2.imread(f'{S}/{n}.png') for n in boxes]); sheet=cv2.resize(sheet,None,fx=.3,fy=.3,interpolation=cv2.INTER_AREA); cv2.imwrite(S+'/rect.jpg',sheet)
