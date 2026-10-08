import{a as yt}from"./chunk-ZWDL2XHY.js";import{a as xt}from"./chunk-LDYIF3DJ.js";import"./chunk-5JBYUV7H.js";import"./chunk-36YE74CQ.js";import"./chunk-BDUGOG6J.js";import"./chunk-Y4T4PE73.js";import"./chunk-D5R77TGS.js";import"./chunk-ZW4CN3XJ.js";import"./chunk-2CPIDWVS.js";import"./chunk-ST2ZCEXA.js";import"./chunk-AN2YYZIE.js";import"./chunk-B43CR53C.js";import"./chunk-FXQNBAFU.js";import"./chunk-XRK77DCC.js";import"./chunk-4QOQ3AVK.js";import"./chunk-BRQLOFUA.js";import"./chunk-3J256FOG.js";import"./chunk-P45CWOGJ.js";import{a as mt}from"./chunk-WHRFAXXM.js";import{o as U}from"./chunk-CDE7BSEC.js";import"./chunk-KYV6NIEV.js";import{O as it,T as ot,U as lt,V as st,W as ct,X as dt,Y as ft,Z as pt,h as Z,j as nt,t as G}from"./chunk-FUV4E2MS.js";import{b as E}from"./chunk-XTASYECX.js";import{a as i}from"./chunk-2VB4RCU6.js";var $t=i(()=>({domains:new Map,transitions:[]}),"createDefaultData"),O=$t(),vt=i(()=>O.domains,"getDomains"),zt=i(()=>O.transitions,"getTransitions"),Mt=i(t=>{if(t)for(let e of t){let a=e.domain,r=(e.items??[]).map(s=>({label:s.label}));O.domains.set(a,{name:a,items:r})}},"setDomains"),Lt=i(t=>{t&&(O.transitions=t.filter(e=>e.from===e.to?(E.warn(`Cynefin: self-loop transition on domain "${e.from}" is not meaningful and will be skipped.`),!1):!0).map(e=>({from:e.from,to:e.to,label:e.label||void 0})))},"setTransitions"),Ft=i(()=>U({...nt.cynefin,...G().cynefin}),"getConfig"),It=i(()=>{ot(),O=$t()},"clear"),Y={getDomains:vt,getTransitions:zt,setDomains:Mt,setTransitions:Lt,getConfig:Ft,clear:It,setAccTitle:lt,getAccTitle:st,setDiagramTitle:ft,getDiagramTitle:pt,getAccDescription:dt,setAccDescription:ct},Pt=i(t=>{yt(t,Y),Y.setDomains(t.domains),Y.setTransitions(t.transitions)},"populate"),Rt={parse:i(async t=>{let e=await xt("cynefin",t);E.debug(e),Pt(e)},"parse")};function N(t){let e=t+1831565813|0;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}i(N,"seededRandom");function ut(t){let e=0;for(let a=0;a<t.length;a++){let r=t.charCodeAt(a);e=(e<<5)-e+r,e|=0}return e}i(ut,"hashString");function gt(t,e){return typeof t=="number"&&Number.isFinite(t)&&t!==0?t:ut(e)}i(gt,"resolveSeed");function bt(t,e,a,r){let s=t/2,p=r??t*.015,D=7,P=e/D,d=[];for(let n=0;n<=D;n++){let m=N(a+n*17)*p*2-p;d.push({x:s+m,y:n*P})}let k=`M${d[0].x},${d[0].y}`;for(let n=0;n<d.length-1;n++){let m=d[n],l=d[n+1],f=(m.y+l.y)/2,b=n%2===0?1:-1,h=p*1.5*b*N(a+n*31+7),R=m.x+h,W=f,V=l.x-h;k+=` C${R},${W} ${V},${f} ${l.x},${l.y}`}return k}i(bt,"generateFoldPath");function wt(t,e,a,r){let s=e/2,p=r??e*.015,D=7,P=t/D,d=[];for(let n=0;n<=D;n++){let m=N(a+n*23)*p*2-p;d.push({x:n*P,y:s+m})}let k=`M${d[0].x},${d[0].y}`;for(let n=0;n<d.length-1;n++){let m=d[n],l=d[n+1],f=(m.x+l.x)/2,b=n%2===0?1:-1,h=p*1.5*b*N(a+n*37+11),R=f,W=m.y+h,V=f,H=l.y-h;k+=` C${R},${W} ${V},${H} ${l.x},${l.y}`}return k}i(wt,"generateHorizontalBoundary");function Ct(t,e){let a=t/2,r=e*.5,s=e,p=t*.03;return[`M${a},${r}`,`C${a+p},${r+(s-r)*.2}`,`${a-p*1.5},${r+(s-r)*.55}`,`${a+p*.5},${r+(s-r)*.75}`,`C${a-p},${r+(s-r)*.85}`,`${a+p*.3},${r+(s-r)*.95}`,`${a},${s}`].join(" ")}i(Ct,"generateCliffPath");function Dt(t,e,a,r){return[`M${t-a},${e}`,`A${a},${r} 0 1,1 ${t+a},${e}`,`A${a},${r} 0 1,1 ${t-a},${e}`,"Z"].join(" ")}i(Dt,"generateConfusionPath");var ht={complex:{model:"Probe \u2192 Sense \u2192 Respond",practice:"Emergent Practices"},complicated:{model:"Sense \u2192 Analyse \u2192 Respond",practice:"Good Practices"},clear:{model:"Sense \u2192 Categorise \u2192 Respond",practice:"Best Practices"},chaotic:{model:"Act \u2192 Sense \u2192 Respond",practice:"Novel Practices"},confusion:{model:"",practice:"Disorder"}},Wt=i((t,e)=>{let a=t/2,r=e/2;return{complex:{cx:a/2,cy:r/2,x:0,y:0,w:a,h:r},complicated:{cx:a+a/2,cy:r/2,x:a,y:0,w:a,h:r},chaotic:{cx:a/2,cy:r+r/2,x:0,y:r,w:a,h:r},clear:{cx:a+a/2,cy:r+r/2,x:a,y:r,w:a,h:r},confusion:{cx:a,cy:r,x:a*.7,y:r*.7,w:a*.6,h:r*.6}}},"getDomainLayouts"),Vt=i(()=>{let t=Z(),e=G();return U(t,e.themeVariables).cynefin},"getCynefinDomainColors"),J=3,Ht=i((t,e,a,r)=>{let s=r.db,p=s.getDomains(),D=s.getTransitions(),P=s.getDiagramTitle(),d=s.getAccTitle(),k=s.getAccDescription(),n=s.getConfig(),m=Vt();E.debug("Rendering Cynefin diagram");let l=n.width,f=n.height,b=n.padding,h=n.showDomainDescriptions,R=n.boundaryAmplitude,W=l+b*2,V=f+b*2,H={complex:m.complexBg,complicated:m.complicatedBg,clear:m.clearBg,chaotic:m.chaoticBg,confusion:m.confusionBg},B=mt(e);it(B,V,W,n.useMaxWidth??!0),B.attr("viewBox",`0 0 ${W} ${V}`),d&&B.append("title").text(d),k&&B.append("desc").text(k);let A=B.append("g").attr("transform",`translate(${b}, ${b})`),j=Wt(l,f),K=gt(n.seed,e),kt=A.append("g").attr("class","cynefin-backgrounds"),q=["complex","complicated","chaotic","clear"];for(let c of q){let o=j[c];kt.append("rect").attr("class","cynefinDomain").attr("x",o.x).attr("y",o.y).attr("width",o.w).attr("height",o.h).attr("fill",H[c]).attr("fill-opacity",.4).attr("stroke","none")}let Q=A.append("g").attr("class","cynefin-boundaries");Q.append("path").attr("class","cynefinBoundary").attr("d",bt(l,f,K,R)).attr("fill","none"),Q.append("path").attr("class","cynefinBoundary").attr("d",wt(l,f,K+100,R)).attr("fill","none"),Q.append("path").attr("class","cynefinCliff").attr("d",Ct(l,f)).attr("fill","none");let Bt=l*.15,At=f*.15;A.append("path").attr("class","cynefinConfusion").attr("d",Dt(l/2,f/2,Bt,At)).attr("fill",H.confusion).attr("fill-opacity",.5);let _=A.append("g").attr("class","cynefin-labels");for(let c of q){let o=j[c];_.append("text").attr("class","cynefinDomainLabel").attr("x",o.cx).attr("y",h?o.cy-30:o.cy).attr("text-anchor","middle").attr("dominant-baseline","middle").text(c.charAt(0).toUpperCase()+c.slice(1))}if(_.append("text").attr("class","cynefinDomainLabel").attr("x",l/2).attr("y",h?f/2-10:f/2).attr("text-anchor","middle").attr("dominant-baseline","middle").text("Confusion"),h){let c=A.append("g").attr("class","cynefin-subtitles");for(let o of q){let x=j[o],y=ht[o];c.append("text").attr("class","cynefinSubtitle").attr("x",x.cx).attr("y",x.cy-10).attr("text-anchor","middle").attr("dominant-baseline","middle").text(y.model),c.append("text").attr("class","cynefinSubtitle").attr("x",x.cx).attr("y",x.cy+5).attr("text-anchor","middle").attr("dominant-baseline","middle").text(y.practice)}c.append("text").attr("class","cynefinSubtitle").attr("x",l/2).attr("y",f/2+8).attr("text-anchor","middle").attr("dominant-baseline","middle").text(ht.confusion.practice)}let tt=A.append("g").attr("class","cynefin-items"),T=26,et=10,Tt=["complex","complicated","chaotic","clear","confusion"];for(let c of Tt){let o=p.get(c);if(!o||o.items.length===0)continue;let x=j[c],y=c==="confusion",M=o.items,L=0;y&&o.items.length>J&&(L=o.items.length-J,M=o.items.slice(0,J));let S;if(y){let u=h?22:14;S=x.cy+u}else S=x.cy+(h?25:15);if([...M].forEach((u,v)=>{let w=S+v*(T+4),z=tt.append("g"),F=z.append("text").attr("class","cynefinItemText").attr("x",0).attr("y",T/2).attr("text-anchor","middle").attr("dominant-baseline","central").text(u.label),g=u.label.length*7,$=F.node();if($&&typeof $.getBBox=="function"){let X=$.getBBox();X.width>0&&(g=X.width)}let C=g+et*2,I=x.cx-C/2;z.attr("transform",`translate(${I}, ${w})`),z.insert("rect","text").attr("class","cynefinItem").attr("x",0).attr("y",0).attr("width",C).attr("height",T).attr("rx",4).attr("ry",4).attr("fill",H[c]).attr("fill-opacity",.95),F.attr("x",C/2).attr("y",T/2)}),L>0){let u=S+M.length*(T+4),v=`+${L} more`,w=tt.append("g"),z=w.append("text").attr("class","cynefinItemText").attr("x",0).attr("y",T/2).attr("text-anchor","middle").attr("dominant-baseline","central").text(v),F=v.length*7,g=z.node();if(g&&typeof g.getBBox=="function"){let I=g.getBBox();I.width>0&&(F=I.width)}let $=F+et*2,C=x.cx-$/2;w.attr("transform",`translate(${C}, ${u})`),w.insert("rect","text").attr("class","cynefinItemOverflow").attr("x",0).attr("y",0).attr("width",$).attr("height",T).attr("rx",4).attr("ry",4).attr("fill",H[c]).attr("fill-opacity",.6),z.attr("x",$/2).attr("y",T/2)}}if(D.length>0){let c=B.select("defs").empty()?B.append("defs"):B.select("defs"),o=`cynefin-arrow-${e}`;c.append("marker").attr("id",o).attr("viewBox","0 0 10 10").attr("refX",9).attr("refY",5).attr("markerWidth",6).attr("markerHeight",6).attr("orient","auto-start-reverse").append("path").attr("d","M 0 0 L 10 5 L 0 10 z").attr("class","cynefinArrowHead");let x=A.append("g").attr("class","cynefin-arrows");D.forEach(y=>{let M=j[y.from],L=j[y.to];if(!M||!L)return;if(y.from===y.to){E.warn(`Cynefin renderer: skipping self-loop on domain "${y.from}"`);return}let S=M.cx,u=M.cy,v=L.cx,w=L.cy,z=(S+v)/2,F=(u+w)/2,g=v-S,$=w-u,C=Math.sqrt(g*g+$*$),I=C*.15,X=-$/C,St=g/C,at=z+X*I,rt=F+St*I;x.append("path").attr("class","cynefinArrowLine").attr("d",`M${S},${u} Q${at},${rt} ${v},${w}`).attr("fill","none").attr("marker-end",`url(#${o})`),y.label&&x.append("text").attr("class","cynefinArrowLabel").attr("x",at).attr("y",rt-6).attr("text-anchor","middle").attr("dominant-baseline","auto").text(y.label)})}P&&A.append("text").attr("class","cynefinTitle").attr("x",l/2).attr("y",-b/2).attr("text-anchor","middle").attr("dominant-baseline","middle").text(P)},"draw"),jt={draw:Ht},Et=i(()=>{let t=Z(),e=G();return U(t,e.themeVariables).cynefin},"getCynefinTheme"),Nt=i(()=>{let t=Et();return`
	.cynefinDomain {
		stroke: none;
	}
	.cynefinDomainLabel {
		font-size: ${t.domainFontSize}px;
		font-weight: bold;
		fill: ${t.labelColor};
	}
	.cynefinSubtitle {
		font-size: ${t.itemFontSize-1}px;
		fill: ${t.textColor};
		font-style: italic;
	}
	.cynefinItem {
		fill-opacity: 0.95;
		stroke: ${t.boundaryColor};
		stroke-width: 1;
	}
	.cynefinItemText {
		font-size: ${t.itemFontSize}px;
		fill: ${t.textColor};
	}
	.cynefinItemOverflow {
		fill-opacity: 0.6;
		stroke: ${t.boundaryColor};
		stroke-width: 1;
		stroke-dasharray: 3 2;
	}
	.cynefinBoundary {
		stroke: ${t.boundaryColor};
		stroke-width: ${t.boundaryWidth};
		stroke-dasharray: 6 3;
	}
	.cynefinCliff {
		stroke: ${t.cliffColor};
		stroke-width: ${t.cliffWidth};
	}
	.cynefinConfusion {
		stroke: ${t.boundaryColor};
		stroke-width: 1.5;
		stroke-dasharray: 4 2;
	}
	.cynefinArrowLine {
		stroke: ${t.arrowColor};
		stroke-width: ${t.arrowWidth};
		fill: none;
	}
	.cynefinArrowHead {
		fill: ${t.arrowColor};
		stroke: none;
	}
	.cynefinArrowLabel {
		font-size: ${t.itemFontSize-1}px;
		fill: ${t.textColor};
	}
	.cynefinTitle {
		font-size: ${t.domainFontSize+2}px;
		font-weight: bold;
		fill: ${t.labelColor};
	}
	`},"styles"),Ot=Nt,ye={parser:Rt,db:Y,renderer:jt,styles:Ot};export{ye as diagram};
