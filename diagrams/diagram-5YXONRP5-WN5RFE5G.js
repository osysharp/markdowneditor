import{a as P}from"./chunk-ZWDL2XHY.js";import{a as z}from"./chunk-LDYIF3DJ.js";import"./chunk-5JBYUV7H.js";import"./chunk-36YE74CQ.js";import"./chunk-BDUGOG6J.js";import"./chunk-Y4T4PE73.js";import"./chunk-D5R77TGS.js";import"./chunk-ZW4CN3XJ.js";import"./chunk-2CPIDWVS.js";import"./chunk-ST2ZCEXA.js";import"./chunk-AN2YYZIE.js";import"./chunk-B43CR53C.js";import"./chunk-FXQNBAFU.js";import"./chunk-XRK77DCC.js";import"./chunk-4QOQ3AVK.js";import"./chunk-BRQLOFUA.js";import"./chunk-3J256FOG.js";import"./chunk-P45CWOGJ.js";import{a as F}from"./chunk-WHRFAXXM.js";import{o as y}from"./chunk-CDE7BSEC.js";import"./chunk-KYV6NIEV.js";import{O as L,T,U as A,V as k,W as O,X as S,Y as I,Z as E,h as C,j as M,t as w}from"./chunk-FUV4E2MS.js";import{b}from"./chunk-XTASYECX.js";import{a as l}from"./chunk-2VB4RCU6.js";var x={showLegend:!0,ticks:5,max:null,min:0,graticule:"circle"},R={axes:[],curves:[],options:x},u=structuredClone(R),H=M.radar,U=l(()=>y({...H,...w().radar}),"getConfig"),D=l(()=>u.axes,"getAxes"),X=l(()=>u.curves,"getCurves"),Y=l(()=>u.options,"getOptions"),Z=l(a=>{u.axes=a.map(t=>({name:t.name,label:t.label??t.name}))},"setAxes"),q=l(a=>{u.curves=a.map(t=>({name:t.name,label:t.label??t.name,entries:J(t.entries)}))},"setCurves"),J=l(a=>{if(a[0].axis==null)return a.map(e=>e.value);let t=D();if(t.length===0)throw new Error("Axes must be populated before curves for reference entries");return t.map(e=>{let r=a.find(i=>i.axis?.$refText===e.name);if(r===void 0)throw new Error("Missing entry for axis "+e.label);return r.value})},"computeCurveEntries"),K=l(a=>{let t=a.reduce((e,r)=>(e[r.name]=r,e),{});u.options={showLegend:t.showLegend?.value??x.showLegend,ticks:t.ticks?.value??x.ticks,max:t.max?.value??x.max,min:t.min?.value??x.min,graticule:t.graticule?.value??x.graticule}},"setOptions"),N=l(()=>{T(),u=structuredClone(R)},"clear"),$={getAxes:D,getCurves:X,getOptions:Y,setAxes:Z,setCurves:q,setOptions:K,getConfig:U,clear:N,setAccTitle:A,getAccTitle:k,setDiagramTitle:I,getDiagramTitle:E,getAccDescription:S,setAccDescription:O},Q=l(a=>{P(a,$);let{axes:t,curves:e,options:r}=a;$.setAxes(t),$.setCurves(e),$.setOptions(r)},"populate"),tt={parse:l(async a=>{let t=await z("radar",a);b.debug(t),Q(t)},"parse")},et=l((a,t,e,r)=>{let i=r.db,n=i.getAxes(),c=i.getCurves(),s=i.getOptions(),o=i.getConfig(),p=i.getDiagramTitle(),m=F(t),d=at(m,o),g=s.max??Math.max(...c.map(v=>Math.max(...v.entries))),h=s.min,f=Math.min(o.width,o.height)/2;rt(d,n,f,s.ticks,s.graticule),it(d,n,f,o),W(d,n,c,h,g,s.graticule,o),V(d,c,s.showLegend,o),d.append("text").attr("class","radarTitle").text(p).attr("x",0).attr("y",-o.height/2-o.marginTop)},"draw"),at=l((a,t)=>{let e=t.width+t.marginLeft+t.marginRight,r=t.height+t.marginTop+t.marginBottom,i={x:t.marginLeft+t.width/2,y:t.marginTop+t.height/2};return L(a,r,e,t.useMaxWidth??!0),a.attr("viewBox",`0 0 ${e} ${r}`).attr("overflow","visible"),a.append("g").attr("transform",`translate(${i.x}, ${i.y})`)},"drawFrame"),rt=l((a,t,e,r,i)=>{if(i==="circle")for(let n=0;n<r;n++){let c=e*(n+1)/r;a.append("circle").attr("r",c).attr("class","radarGraticule")}else if(i==="polygon"){let n=t.length;for(let c=0;c<r;c++){let s=e*(c+1)/r,o=t.map((p,m)=>{let d=2*m*Math.PI/n-Math.PI/2,g=s*Math.cos(d),h=s*Math.sin(d);return`${g},${h}`}).join(" ");a.append("polygon").attr("points",o).attr("class","radarGraticule")}}},"drawGraticule"),it=l((a,t,e,r)=>{let i=t.length;for(let n=0;n<i;n++){let c=t[n].label,s=2*n*Math.PI/i-Math.PI/2,o=Math.cos(s),p=Math.sin(s);a.append("line").attr("x1",0).attr("y1",0).attr("x2",e*r.axisScaleFactor*o).attr("y2",e*r.axisScaleFactor*p).attr("class","radarAxisLine");let m=o>.01?"start":o<-.01?"end":"middle",d=p>.01?"hanging":p<-.01?"auto":"central",g=4;a.append("text").text(c).attr("x",e*r.axisLabelFactor*o+g*o).attr("y",e*r.axisLabelFactor*p+g*p).attr("text-anchor",m).attr("dominant-baseline",d).attr("class","radarAxisLabel")}},"drawAxes");function W(a,t,e,r,i,n,c){let s=t.length,o=Math.min(c.width,c.height)/2;e.forEach((p,m)=>{if(p.entries.length!==s)return;let d=p.entries.map((g,h)=>{let f=2*Math.PI*h/s-Math.PI/2,v=B(g,r,i,o),j=v*Math.cos(f),_=v*Math.sin(f);return{x:j,y:_}});n==="circle"?a.append("path").attr("d",G(d,c.curveTension)).attr("class",`radarCurve-${m}`):n==="polygon"&&a.append("polygon").attr("points",d.map(g=>`${g.x},${g.y}`).join(" ")).attr("class",`radarCurve-${m}`)})}l(W,"drawCurves");function B(a,t,e,r){let i=Math.min(Math.max(a,t),e);return r*(i-t)/(e-t)}l(B,"relativeRadius");function G(a,t){let e=a.length,r=`M${a[0].x},${a[0].y}`;for(let i=0;i<e;i++){let n=a[(i-1+e)%e],c=a[i],s=a[(i+1)%e],o=a[(i+2)%e],p={x:c.x+(s.x-n.x)*t,y:c.y+(s.y-n.y)*t},m={x:s.x-(o.x-c.x)*t,y:s.y-(o.y-c.y)*t};r+=` C${p.x},${p.y} ${m.x},${m.y} ${s.x},${s.y}`}return`${r} Z`}l(G,"closedRoundCurve");function V(a,t,e,r){if(!e)return;let i=(r.width/2+r.marginRight)*3/4,n=-(r.height/2+r.marginTop)*3/4,c=20;t.forEach((s,o)=>{let p=a.append("g").attr("transform",`translate(${i}, ${n+o*c})`);p.append("rect").attr("width",12).attr("height",12).attr("class",`radarLegendBox-${o}`),p.append("text").attr("x",16).attr("y",0).attr("class","radarLegendText").text(s.label)})}l(V,"drawLegend");var st={draw:et},ot=l((a,t)=>{let e="";for(let r=0;r<a.THEME_COLOR_LIMIT;r++){let i=a[`cScale${r}`];e+=`
		.radarCurve-${r} {
			color: ${i};
			fill: ${i};
			fill-opacity: ${t.curveOpacity};
			stroke: ${i};
			stroke-width: ${t.curveStrokeWidth};
		}
		.radarLegendBox-${r} {
			fill: ${i};
			fill-opacity: ${t.curveOpacity};
			stroke: ${i};
		}
		`}return e},"genIndexStyles"),lt=l(a=>{let t=C(),e=w(),r=y(t,e.themeVariables),i=y(r.radar,a);return{themeVariables:r,radarOptions:i}},"buildRadarStyleOptions"),nt=l(({radar:a}={})=>{let{themeVariables:t,radarOptions:e}=lt(a);return`
	.radarTitle {
		font-size: ${t.fontSize};
		color: ${t.titleColor};
		dominant-baseline: hanging;
		text-anchor: middle;
	}
	.radarAxisLine {
		stroke: ${e.axisColor};
		stroke-width: ${e.axisStrokeWidth};
	}
	.radarAxisLabel {
		font-size: ${e.axisLabelFontSize}px;
		color: ${e.axisColor};
	}
	.radarGraticule {
		fill: ${e.graticuleColor};
		fill-opacity: ${e.graticuleOpacity};
		stroke: ${e.graticuleColor};
		stroke-width: ${e.graticuleStrokeWidth};
	}
	.radarLegendText {
		text-anchor: start;
		font-size: ${e.legendFontSize}px;
		dominant-baseline: hanging;
	}
	${ot(t,e)}
	`},"styles"),Ft={parser:tt,db:$,renderer:st,styles:nt};export{Ft as diagram};
