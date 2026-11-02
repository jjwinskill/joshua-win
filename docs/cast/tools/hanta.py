import cv2,numpy as np,json
from trace import mask_for,scale,pad
import potrace
m=mask_for('hanta',thr=.40,sigma=3.2,minarea=110)
# nothing below the marker's end at the hip, and not the printed legs
m[int((pad+33.4)*scale):,:]=0
# marker strokes only: drop the thin pencil lines
k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7))
o=cv2.morphologyEx(m,cv2.MORPH_OPEN,k)
n,l,st,_=cv2.connectedComponentsWithStats(o)
for i in range(1,n):
    if st[i,4]<70 or st[i,1]<int((pad+0.2)*scale) and st[i,4]<600:o[l==i]=0
U=lambda x,y:(int((x+pad)*scale),int((y+pad)*scale))
# a leaner jaw on the picture's right: lift the old line and draw a new one
cv2.polylines(o,[np.array([U(26,18.2),U(25.9,20),U(25.7,22.5),U(25,23.9),U(23,25),U(21,25.3)])],False,0,thickness=int(1.9*scale))
cv2.polylines(o,[np.array([U(26.1,17.4),U(25.5,19.6),U(24.4,22),U(22.8,23.7),U(20.8,24.7),U(19,24.9)])],False,1,thickness=int(1.0*scale),lineType=cv2.LINE_AA)
# he looks to the picture's right: lift the drawn pupils, and the irises go in the corners
o[int((pad+12.05)*scale):int((pad+13.45)*scale),int((pad+15)*scale):int((pad+15.85)*scale)]=0
o[int((pad+12.3)*scale):int((pad+13.65)*scale),int((pad+22.55)*scale):int((pad+23.45)*scale)]=0
k2=4
o2=cv2.resize(o*255,None,fx=1/k2,fy=1/k2,interpolation=cv2.INTER_AREA)>120
pl=potrace.Bitmap(~o2).trace(turdsize=6,alphamax=1.2,opttolerance=1.5)
f=lambda p:f'{p.x*k2/scale-pad:.1f} {p.y*k2/scale-pad:.1f}'
d=[]
for c in pl:
    d.append('M'+f(c.start_point))
    for s in c.segments:
        d.append(('L'+f(s.c)+'L'+f(s.end_point)) if s.is_corner else ('C'+f(s.c1)+' '+f(s.c2)+' '+f(s.end_point)))
    d.append('Z')
d=''.join(d);open('hanta-trace.txt','w').write(d);print(len(d),len(pl))
