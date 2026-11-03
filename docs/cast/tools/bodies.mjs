import fs0 from 'fs';
const hantaTrace=fs0.readFileSync('hanta-trace.txt','utf8');
const ink='#231f1a';
const P=(d,o={})=>`<path d="${d}"${o.f?` fill="${o.f}"`:''}${o.w?` stroke-width="${o.w}"`:''}${o.n?' stroke="none"':''}/>`;
export const flats={iris:'#7a4a24',hair:'#33261b',neck:'#d2ab82',coat:'#8d8672',shirt:'#ece5d3',skin:'#e6c6a0',eye:'#fffaf3',paper:'#f7f2e6',crease:'#e2dac8',steel:'#9fadb3',back:'#dde1df',deep:'#7c8a91',hazard:'#f4c430',lamp:'#e63946',go:'#58b368',glass:'#d9e8ea',milk:'#fffdf6',milktop:'#f1ecdd'};
export function bodies(c){return {
hanta:[`<g transform="translate(20 33) scale(.965) translate(-20 -33)">`,
 P('M.6 25.3 6.6 23.9 7.9 21.2 12 20.3 26.2 21.2 29.7 23.6 39.6 25.7Q39.8 30 38 34.6 20 35.3 2.2 34.6 .2 30 .6 25.3Z',{f:c.coat,w:1.3}),
 P('M11 22.6Q10.6 27 12.3 30 13 32 13 34 20 34.3 24 34 25.5 28 25.9 24.6 18 27 11 22.6Z',{f:c.shirt,n:1}),
 P('M12.2 20 11 22.6Q18 27.6 25.9 24.6L26.2 19.5Z',{f:c.neck,n:1}),
 P('M10 9.6 7.2 9.6C6.2 12 6.6 15 7.4 16.6 8 17.6 9.2 17.6 10.4 16.8Z',{f:c.skin,n:1}),
 P('M28 10.4 29.6 10.6C30 12 29.6 14 28.6 15.6 28 16 27.4 16.2 26.8 16.2Z',{f:c.skin,n:1}),
 P('M10.4 4.8C10.4 12 10.8 17 12 20.3 14 22 15.5 23.3 17 24.6 20 25.2 22.8 23.8 24.4 22 25.5 19.6 26 17.4 26.6 16.4 27 13 27.4 11 27 4.8Z',{f:c.skin,n:1}),
 P('M13.2 11.8 17 12.1 17.2 13.6 13.2 13.8ZM21.4 12.5 25.2 12 25.2 13.7 21.4 13.9Z',{f:c.eye,n:1}),
 P('M16.55 11.75a1 1 0 1 0 .01 0ZM24.3 11.95a1 1 0 1 0 .01 0Z',{f:c.iris,n:1}),
 P('M16.55 12.3a.45 .45 0 1 0 .01 0ZM24.3 12.5a.45 .45 0 1 0 .01 0Z',{f:ink,n:1}),
 // the hair's fill is a soft dome inside the strands, so the top doesn't read flat
 P('M8 9.2 6.7 7.2C6.3 4.6 8.6 2.4 12 2.1C15 1.8 23 1.7 26.5 2.2C29.6 2.7 31 4.5 30.2 6.3L29.4 7.6 28 8.6 25.4 8.6 21.5 6.6 19 5.8 15.5 8.2 11 8.6Z',{f:c.hair,n:1}),
 `<path d="${hantaTrace}" fill="${ink}" stroke="none" fill-rule="evenodd"/>`,
 `</g>`],
paper:[`<g transform="translate(0 2.3)">`,
 P('M16.9 6.5 14 5.7 13.4 4.5 8.5 6.2 8.4 8.2 6.3 9.2 6.2 13 3.7 16.5 5.8 20.5 7.6 21.9 8 23 5.9 27 10 29 10 30.8 15.3 32.6 20 30.3 23.5 31 26.5 27.8 28.7 27.7 28.7 24 30.5 24 33 20 29.8 16 30 11.8 28.3 10.8 27.8 7.2 25 7.3 23 4.3Z',{f:c.paper,w:1.35}),
 P('M7.7 10.3 15.5 8.3 16.2 11 12.5 11.5ZM18.2 10 24 13.5 24.2 20 21 18 19 12ZM19.5 21.8 26.8 25.7 27.8 23.5 26 21ZM12.8 23.7 11.8 30 14 30.4 15 25Z',{f:c.crease,n:1}),
 P('M7.7 10.3 15.5 8.3 16.2 11 12.5 11.5M7.7 10.3 10 16 10 19 11.5 20.2M7.4 14.3 6.6 16.5 8.7 18.2M12.2 14.5 14.5 17.8 20 18.2M19.2 8.5 18.2 10 24 13.5 24.2 20M21.8 10 27.8 14.2 26.6 21M16.5 21.8 18.5 25 22.8 29.2 15 27M19.5 21.8 26.8 25.7 27.8 23.5M12.8 23.7 11.8 30 14 30.4M10.7 22.5 10.2 25.8',{w:1}),
 `</g>`],
press:[
 P('M15 28 25 28 25 34.4 15 34.4Z',{f:c.deep,w:1.4}),
 P('M11 6 29 6 29 23 11 23Z',{f:c.back,n:1}),
 P('M17.4 6.5V14M22.4 6.5V13.6',{w:1.2}),
 P('M11.2 6.4 14.6 6.4 14.6 22.6 11.2 22.6ZM25.8 6.4 28.8 6.4 28.8 22.6 25.8 22.6Z',{f:c.steel,w:1.2}),
 P('M15.9 14.2 23.7 13.5 24.3 18.5 15.7 18.9Z',{f:c.hazard,w:1.2}),
 P('M17 18.5 18.6 15M19.7 18.4 21.3 14.8M22.2 18.4 23.5 15.4',{w:1.1}),
 P('M9.7 2 30 1.6 30.1 5.9 9.8 6.5Z',{f:c.steel,w:1.3}),
 P('M8.8 23.1 30.2 22.8 30.3 27.9 9.5 28.8Z',{f:c.steel,w:1.3}),
 P('M7.8 29 13.5 28.8 13.5 31.2 7.9 32Z',{f:c.deep,w:1.3}),
 P('M27 28.8 32.8 28.4 32.8 30.6 27 31.2Z',{f:c.deep,w:1.3}),
],
milk:[
 P('M9.7 7.6 28.8 7C27 17 25 27 24.9 34.2L13.9 34.2Z',{f:c.glass,n:1}),
 P('M10.9 15.4 26.9 13.8C26 20 25 27 24.9 34L13.9 34Z',{f:c.milk,n:1}),
 P('M10.8 14.8Q14 12.8 18 12.3 24 11.9 26.9 13.1 27 14 26.9 14.6 19 16.2 11 15.9Z',{f:c.milktop,w:1.1}),
 P('M14.7 18 16.2 27.5M23.4 18 21.3 27.5',{w:.9}),
 P('M9.7 7.5Q15 5.2 20 4.4 27 4.5 28.7 6.8Q29 7 28.8 7.4 18 8.6 9.8 8.3Z',{f:c.glass,w:1.25}),
 P('M9.7 7.8 13.9 34.2Q20 33.7 24.9 34.2C25 27 27 17 28.8 7.2',{w:1.35}),
]}};
export const inkOnly={};for(const k of ['coat','shirt','skin','eye','paper','crease','steel','back','deep','hazard','glass','milk','milktop','lamp','go'])inkOnly[k]='#fffdf6';inkOnly.iris='#7a4a24';inkOnly.hair='#33261b';inkOnly.neck='#fffdf6';inkOnly.lamp=ink;inkOnly.go=ink;inkOnly.hazard='#fffdf6';
const legs=`<g stroke-width="1.8"><path d="M23 33V39.5V45.5H26.4M17 33V39.5V45.5H20.4"/></g>`;
export const svg=(parts,w,bg='none')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 47" width="${w}" height="${w*47/40}" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="overflow:visible">${legs}<g>${parts.join('')}</g></svg>`;
