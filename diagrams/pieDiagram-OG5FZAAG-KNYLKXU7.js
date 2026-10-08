import{a as le}from"./chunk-ZWDL2XHY.js";import{a as oe}from"./chunk-LDYIF3DJ.js";import"./chunk-5JBYUV7H.js";import"./chunk-36YE74CQ.js";import"./chunk-BDUGOG6J.js";import"./chunk-Y4T4PE73.js";import"./chunk-D5R77TGS.js";import"./chunk-ZW4CN3XJ.js";import"./chunk-2CPIDWVS.js";import"./chunk-ST2ZCEXA.js";import"./chunk-AN2YYZIE.js";import"./chunk-B43CR53C.js";import"./chunk-FXQNBAFU.js";import"./chunk-XRK77DCC.js";import"./chunk-4QOQ3AVK.js";import"./chunk-BRQLOFUA.js";import"./chunk-3J256FOG.js";import"./chunk-P45CWOGJ.js";import{a as ae}from"./chunk-WHRFAXXM.js";import{n as re,o as ie}from"./chunk-CDE7BSEC.js";import"./chunk-KYV6NIEV.js";import{O as q,T as G,U as J,V as K,W as Q,X as Y,Y as Z,Z as ee,_ as te,j as _}from"./chunk-FUV4E2MS.js";import{F as z,I as X,b as T,m as U}from"./chunk-XTASYECX.js";import{a as o}from"./chunk-2VB4RCU6.js";var se=_.pie,F={sections:new Map,showData:!1,config:se},k=F.sections,H=F.showData,we=structuredClone(se),Se=o(()=>structuredClone(we),"getConfig"),$e=o(()=>{k=new Map,H=F.showData,G()},"clear"),ve=o(({label:e,value:a})=>{if(a<0)throw new Error(`"${e}" has invalid value: ${a}. Negative values are not allowed in pie charts. All slice values must be >= 0.`);k.has(e)||(k.set(e,a),T.debug(`added new section: ${e}, with value: ${a}`))},"addSection"),be=o(()=>k,"getSections"),ye=o(e=>{H=e},"setShowData"),Ce=o(()=>H,"getShowData"),ne={getConfig:Se,clear:$e,setDiagramTitle:Z,getDiagramTitle:ee,setAccTitle:J,getAccTitle:K,setAccDescription:Q,getAccDescription:Y,addSection:ve,getSections:be,setShowData:ye,getShowData:Ce},Te=o((e,a)=>{le(e,a),a.setShowData(e.showData),e.sections.map(a.addSection)},"populateDb"),ke={parse:o(async e=>{let a=await oe("pie",e);T.debug(a),Te(a,ne)},"parse")},De=o(e=>`
  .pieCircle{
    stroke: ${e.pieStrokeColor};
    stroke-width : ${e.pieStrokeWidth};
    opacity : ${e.pieOpacity};
  }
  .pieCircle.highlighted{
    scale: 1.05;
    opacity: 1;
  }
  .pieCircle.highlightedOnHover:hover{
    transition-duration: 250ms;
    scale: 1.05;
    opacity: 1;
  }
  .pieOuterCircle{
    stroke: ${e.pieOuterStrokeColor};
    stroke-width: ${e.pieOuterStrokeWidth};
    fill: none;
  }
  .pieTitleText {
    text-anchor: middle;
    font-size: ${e.pieTitleTextSize};
    fill: ${e.pieTitleTextColor};
    font-family: ${e.fontFamily};
  }
  .slice {
    font-family: ${e.fontFamily};
    fill: ${e.pieSectionTextColor};
    font-size:${e.pieSectionTextSize};
    // fill: white;
  }
  .legend text {
    fill: ${e.pieLegendTextColor};
    font-family: ${e.fontFamily};
    font-size: ${e.pieLegendTextSize};
  }
`,"getStyles"),Ae=De,Oe=o(e=>{let a=[...e.values()].reduce((p,h)=>p+h,0),W=[...e.entries()].map(([p,h])=>({label:p,value:h})).filter(p=>p.value/a*100>=1);return X().value(p=>p.value).sort(null)(W)},"createPieArcs"),Me=o((e,a,W,p)=>{T.debug(`rendering pie chart
`+e);let h=p.db,B=te(),g=ie(h.getConfig(),B.pie),P=40,i=18,n=4,w=450,S=w,D=ae(a),b=D.append("g");b.attr("transform","translate("+S/2+","+w/2+")");let{themeVariables:l}=B,[E]=re(l.pieOuterStrokeWidth);E??=2;let pe=g.legendPosition,L=g.textPosition,de=g.donutHole>0&&g.donutHole<=.9?g.donutHole:0,u=Math.min(S,w)/2-P,ce=z().innerRadius(de*u).outerRadius(u),me=z().innerRadius(u*L).outerRadius(u*L),$=b.append("g");$.append("circle").attr("cx",0).attr("cy",0).attr("r",u+E/2).attr("class","pieOuterCircle");let y=h.getSections(),he=Oe(y),ge=[l.pie1,l.pie2,l.pie3,l.pie4,l.pie5,l.pie6,l.pie7,l.pie8,l.pie9,l.pie10,l.pie11,l.pie12],A=0;y.forEach(t=>{A+=t});let V=he.filter(t=>(t.data.value/A*100).toFixed(0)!=="0"),O=U(ge).domain([...y.keys()]);$.selectAll("mySlices").data(V).enter().append("path").attr("d",ce).attr("fill",t=>O(t.data.label)).attr("class",t=>{let r="pieCircle";return g.highlightSlice==="hover"?r+=" highlightedOnHover":g.highlightSlice===t.data.label&&(r+=" highlighted"),r}),$.selectAll("mySlices").data(V).enter().append("text").text(t=>(t.data.value/A*100).toFixed(0)+"%").attr("transform",t=>"translate("+me.centroid(t)+")").style("text-anchor","middle").attr("class","slice");let ue=b.append("text").text(h.getDiagramTitle()).attr("x",0).attr("y",-(w-50)/2).attr("class","pieTitleText"),v=[...y.entries()].map(([t,r])=>({label:t,value:r})),f=b.selectAll(".legend").data(v).enter().append("g").attr("class","legend");f.append("rect").attr("width",i).attr("height",i).style("fill",t=>O(t.label)).style("stroke",t=>O(t.label)),f.append("text").attr("x",i+n).attr("y",i-n).text(t=>h.getShowData()?`${t.label} [${t.value}]`:t.label);let x=Math.max(...f.selectAll("text").nodes().map(t=>t?.getBoundingClientRect().width??0)),C=w,M=S+P,s=i+n,R=v.length*s;switch(pe){case"center":f.attr("transform",(t,r)=>{let d=s*v.length/2,c=-x/2-(i+n),m=r*s-d;return"translate("+c+","+m+")"});break;case"top":C+=R,f.attr("transform",(t,r)=>{let d=u,c=-x/2-(i+n),m=r*s-d;return`translate(${c}, ${m})`}),$.attr("transform",()=>`translate(0, ${R+s})`);break;case"bottom":C+=R,f.attr("transform",(t,r)=>{let d=-u-s,c=-x/2-(i+n),m=r*s-d;return"translate("+c+","+m+")"});break;case"left":M+=i+n+x,f.attr("transform",(t,r)=>{let d=s*v.length/2,c=-u-(i+n),m=r*s-d;return"translate("+c+","+m+")"}),$.attr("transform",()=>`translate(${x+i+n}, 0)`);break;default:M+=i+n+x,f.attr("transform",(t,r)=>{let d=s*v.length/2,c=12*i,m=r*s-d;return"translate("+c+","+m+")"});break}let j=ue.node()?.getBoundingClientRect().width??0,fe=S/2-j/2,xe=S/2+j/2,I=Math.min(0,fe),N=Math.max(M,xe)-I;D.attr("viewBox",`${I} 0 ${N} ${C}`),q(D,C,N,g.useMaxWidth)},"draw"),Re={draw:Me},at={parser:ke,db:ne,renderer:Re,styles:Ae};export{at as diagram};
