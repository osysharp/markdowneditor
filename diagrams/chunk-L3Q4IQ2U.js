import{a as V}from"./chunk-WHRFAXXM.js";import{H as E,O,T as W,_ as q,h as D,t as R}from"./chunk-FUV4E2MS.js";import{b as f}from"./chunk-XTASYECX.js";import{a as m}from"./chunk-2VB4RCU6.js";var v="",z="",N="",M=[],b=new Map,C=m(e=>E(e,q()),"sanitizeText"),$=m(e=>{switch(e.type){case"terminal":return{...e,value:C(e.value)};case"nonterminal":return{...e,name:C(e.name)};case"sequence":return{...e,elements:e.elements.map($)};case"choice":return{...e,alternatives:e.alternatives.map($)};case"optional":return{...e,element:$(e.element)};case"repetition":return{...e,element:$(e.element),separator:e.separator?$(e.separator):void 0};case"special":return{...e,text:C(e.text)}}},"sanitizeAstNode"),U=m(()=>{v="",z="",N="",M.length=0,b.clear(),W(),f.debug("[Railroad] Database cleared")},"clear"),G=m(e=>{v=C(e),f.debug("[Railroad] Title set:",e)},"setTitle"),H=m(()=>v,"getTitle"),J=m(e=>{let i={...e,name:C(e.name),definition:$(e.definition),comment:e.comment?C(e.comment):void 0};f.debug("[Railroad] Adding rule:",i.name),b.has(i.name)&&f.warn(`[Railroad] Rule '${i.name}' is already defined. Overwriting.`),M.push(i),b.set(i.name,i)},"addRule"),K=m(()=>M,"getRules"),Q=m(e=>b.get(e),"getRule"),X=m(e=>{z=C(e).replace(/^\s+/g,""),f.debug("[Railroad] Accessibility title set:",e)},"setAccTitle"),Y=m(()=>z,"getAccTitle"),Z=m(e=>{N=C(e).replace(/\n\s+/g,`
`),f.debug("[Railroad] Accessibility description set:",e)},"setAccDescription"),_=m(()=>N,"getAccDescription"),ee=G,te=H,re={clear:U,setTitle:G,getTitle:H,addRule:J,getRules:K,getRule:Q,setAccTitle:X,getAccTitle:Y,setAccDescription:Z,getAccDescription:_,setDiagramTitle:ee,getDiagramTitle:te},T={compactMode:!1,padding:10,verticalSeparation:8,horizontalSeparation:10,arcRadius:10,fontSize:14,fontFamily:"monospace",terminalFill:"#FFFFC0",terminalStroke:"#000000",terminalTextColor:"#000000",nonTerminalFill:"#FFFFFF",nonTerminalStroke:"#000000",nonTerminalTextColor:"#000000",lineColor:"#000000",strokeWidth:2,markerFill:"#000000",commentFill:"#E8E8E8",commentStroke:"#888888",commentTextColor:"#666666",specialFill:"#F0E0FF",specialStroke:"#8800CC",ruleNameColor:"#000066",showMarkers:!0,markerRadius:5},ie=/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$|^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\([\d\s%+,./-]+\)$|^[a-z]+$/i,ae=/^[\w "',.-]+$/,ne=new Set(["compactMode","padding","verticalSeparation","horizontalSeparation","arcRadius","fontSize","fontFamily","terminalFill","terminalStroke","terminalTextColor","nonTerminalFill","nonTerminalStroke","nonTerminalTextColor","lineColor","strokeWidth","markerFill","commentFill","commentStroke","commentTextColor","specialFill","specialStroke","ruleNameColor","showMarkers","markerRadius"]),I=m(e=>e?Object.keys(e).every(i=>i==="railroad"||ne.has(i)):!1,"isRailroadStyleOptions"),oe=m(e=>e?"railroad"in e&&e.railroad?e.railroad:I(e)?e:{}:{},"extractRailroadOverrides"),le=m(e=>{if(!e||I(e))return{};let{railroad:i,svgId:n,theme:r,look:t,...a}=e;return a},"extractThemeOverrides"),d=m((e,i)=>{if(typeof e!="string")return i;let n=e.trim();return ie.test(n)?n:i},"sanitizeColorValue"),L=m((e,i)=>{if(typeof e!="string")return i;let n=e.trim();return ae.test(n)?n:i},"sanitizeFontFamilyValue"),S=m((e,i)=>{let n=typeof e=="number"?e:typeof e=="string"?Number.parseFloat(e):Number.NaN;return Number.isFinite(n)&&n>=0?n:i},"sanitizeNumberValue"),se=m(e=>{let i=typeof e=="number"?e:typeof e=="string"?Number.parseFloat(e):Number.NaN;return Number.isFinite(i)&&i>0?i:void 0},"parseThemeFontSize"),de=m(e=>{let i=L(e.fontFamily,T.fontFamily),n=se(e.fontSize)??T.fontSize;return{...T,fontFamily:i,fontSize:n,terminalFill:d(e.secondBkg??e.secondaryColor,T.terminalFill),terminalStroke:d(e.secondaryBorderColor??e.lineColor,T.terminalStroke),terminalTextColor:d(e.secondaryTextColor??e.textColor,T.terminalTextColor),nonTerminalFill:d(e.mainBkg??e.background,T.nonTerminalFill),nonTerminalStroke:d(e.primaryBorderColor??e.lineColor,T.nonTerminalStroke),nonTerminalTextColor:d(e.primaryTextColor??e.textColor,T.nonTerminalTextColor),lineColor:d(e.lineColor,T.lineColor),markerFill:d(e.lineColor,T.markerFill),commentFill:d(e.labelBackground??e.tertiaryColor,T.commentFill),commentStroke:d(e.tertiaryBorderColor??e.lineColor,T.commentStroke),commentTextColor:d(e.tertiaryTextColor??e.textColor,T.commentTextColor),specialFill:d(e.tertiaryColor??e.secondaryColor,T.specialFill),specialStroke:d(e.tertiaryBorderColor??e.secondaryBorderColor,T.specialStroke),ruleNameColor:d(e.titleColor??e.textColor,T.ruleNameColor)}},"buildThemeDefaults"),A=m(e=>{let i=R(),n={...D(),...i.themeVariables??{},...le(e)},r=de(n),t={...i.railroad??{},...oe(e)};return{compactMode:t.compactMode??r.compactMode,padding:S(t.padding,r.padding),verticalSeparation:S(t.verticalSeparation,r.verticalSeparation),horizontalSeparation:S(t.horizontalSeparation,r.horizontalSeparation),arcRadius:S(t.arcRadius,r.arcRadius),fontSize:S(t.fontSize,r.fontSize),fontFamily:L(t.fontFamily,r.fontFamily),terminalFill:d(t.terminalFill,r.terminalFill),terminalStroke:d(t.terminalStroke,r.terminalStroke),terminalTextColor:d(t.terminalTextColor,r.terminalTextColor),nonTerminalFill:d(t.nonTerminalFill,r.nonTerminalFill),nonTerminalStroke:d(t.nonTerminalStroke,r.nonTerminalStroke),nonTerminalTextColor:d(t.nonTerminalTextColor,r.nonTerminalTextColor),lineColor:d(t.lineColor,r.lineColor),strokeWidth:S(t.strokeWidth,r.strokeWidth),markerFill:d(t.markerFill,r.markerFill),commentFill:d(t.commentFill,r.commentFill),commentStroke:d(t.commentStroke,r.commentStroke),commentTextColor:d(t.commentTextColor,r.commentTextColor),specialFill:d(t.specialFill,r.specialFill),specialStroke:d(t.specialStroke,r.specialStroke),ruleNameColor:d(t.ruleNameColor,r.ruleNameColor),showMarkers:t.showMarkers??r.showMarkers,markerRadius:S(t.markerRadius,r.markerRadius)}},"buildRailroadStyleOptions"),Te=m(e=>{let{fontFamily:i,fontSize:n,terminalFill:r,terminalStroke:t,terminalTextColor:a,nonTerminalFill:c,nonTerminalStroke:s,nonTerminalTextColor:l,lineColor:u,strokeWidth:o,markerFill:g,commentFill:h,commentStroke:p,commentTextColor:k,specialFill:F,specialStroke:w,ruleNameColor:y}=A(e);return`
  .railroad-diagram {
    font-family: ${i};
    font-size: ${n}px;
  }

  .railroad-terminal rect {
    fill: ${r};
    stroke: ${t};
    stroke-width: ${o}px;
  }

  .railroad-terminal text {
    fill: ${a};
    font-family: ${i};
    font-size: ${n}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-nonterminal rect {
    fill: ${c};
    stroke: ${s};
    stroke-width: ${o}px;
  }

  .railroad-nonterminal text {
    fill: ${l};
    font-family: ${i};
    font-size: ${n}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-line {
    stroke: ${u};
    stroke-width: ${o}px;
    fill: none;
  }

  .railroad-start circle,
  .railroad-end circle {
    fill: ${g};
  }

  .railroad-comment ellipse {
    fill: ${h};
    stroke: ${p};
    stroke-width: ${o}px;
  }

  .railroad-comment text {
    fill: ${k};
    font-style: italic;
    font-family: ${i};
    font-size: ${n}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-special rect {
    fill: ${F};
    stroke: ${w};
    stroke-width: ${o}px;
    stroke-dasharray: 5,3;
  }

  .railroad-special text {
    fill: ${l};
    font-family: ${i};
    font-size: ${n}px;
    text-anchor: middle;
    dominant-baseline: middle;
  }

  .railroad-rule-name {
    font-weight: bold;
    fill: ${y};
    font-family: ${i};
    font-size: ${n}px;
  }

  .railroad-group {
    /* Grouping container, no specific styles */
  }
`},"getStyles"),x=class{constructor(){this.d=""}static{m(this,"PathBuilder")}moveTo(e,i){return this.d+=`M ${e} ${i} `,this}lineTo(e,i){return this.d+=`L ${e} ${i} `,this}horizontalTo(e){return this.d+=`H ${e} `,this}verticalTo(e){return this.d+=`V ${e} `,this}arcTo(e,i,n,r,t,a,c){return this.d+=`A ${e} ${i} ${n} ${r?1:0} ${t?1:0} ${a} ${c} `,this}build(){return this.d.trim()}},me=class{constructor(e,i=A()){this.textCache=new Map,this.svg=e,this.config=i}static{m(this,"RailroadRenderer")}measureText(e){if(this.textCache.has(e))return this.textCache.get(e);let i=this.svg.append("text").attr("font-family",this.config.fontFamily).attr("font-size",this.config.fontSize).text(e),n=i.node().getBBox(),r={width:n.width,height:n.height};return i.remove(),this.textCache.set(e,r),r}renderTerminal(e,i){let n=this.measureText(i),r=n.width+this.config.padding*2,t=n.height+this.config.padding*2,a=e.append("g").attr("class","railroad-terminal");return a.append("rect").attr("x",0).attr("y",0).attr("width",r).attr("height",t).attr("rx",10).attr("ry",10),a.append("text").attr("x",r/2).attr("y",t/2).text(i),{element:a.node(),dimensions:{width:r,height:t,up:t/2,down:t/2}}}renderNonTerminal(e,i){let n=this.measureText(i),r=n.width+this.config.padding*2,t=n.height+this.config.padding*2,a=e.append("g").attr("class","railroad-nonterminal");return a.append("rect").attr("x",0).attr("y",0).attr("width",r).attr("height",t),a.append("text").attr("x",r/2).attr("y",t/2).text(i),{element:a.node(),dimensions:{width:r,height:t,up:t/2,down:t/2}}}renderSequence(e,i){let n=i.map(l=>this.renderExpression(e,l)),r=0,t=0,a=0;for(let l of n)r+=l.dimensions.width,t=Math.max(t,l.dimensions.up),a=Math.max(a,l.dimensions.down);r+=(n.length-1)*this.config.horizontalSeparation;let c=e.append("g").attr("class","railroad-sequence"),s=0;for(let l=0;l<n.length;l++){let u=n[l],o=t-u.dimensions.up;if(c.node().appendChild(u.element).setAttribute("transform",`translate(${s}, ${o})`),l<n.length-1){let g=s+u.dimensions.width,h=g+this.config.horizontalSeparation,p=t;c.append("path").attr("class","railroad-line").attr("d",new x().moveTo(g,p).lineTo(h,p).build())}s+=u.dimensions.width+this.config.horizontalSeparation}return{element:c.node(),dimensions:{width:r,height:t+a,up:t,down:a}}}renderChoice(e,i){let n=i.map(g=>this.renderExpression(e,g)),r=0,t=0;for(let g of n)r=Math.max(r,g.dimensions.width),t+=g.dimensions.height;t+=(n.length-1)*this.config.verticalSeparation;let a=this.config.arcRadius,c=a*4,s=r+c,l=e.append("g").attr("class","railroad-choice"),u=0,o=t/2;for(let g of n){let h=u,p=h+g.dimensions.up,k=a*2+(r-g.dimensions.width)/2;l.node().appendChild(g.element).setAttribute("transform",`translate(${k}, ${h})`);let F=new x,w=p>o;p===o?F.moveTo(0,o).lineTo(k,p):F.moveTo(0,o).arcTo(a,a,0,!1,w,a,o+(w?a:-a)).lineTo(a,p-(w?a:-a)).arcTo(a,a,0,!1,!w,a*2,p).lineTo(k,p),l.append("path").attr("class","railroad-line").attr("d",F.build());let y=new x,B=k+g.dimensions.width,P=s-a*2;p===o?y.moveTo(B,p).lineTo(s,o):y.moveTo(B,p).lineTo(P,p).arcTo(a,a,0,!1,!w,s-a,p+(w?-a:a)).lineTo(s-a,o+(w?a:-a)).arcTo(a,a,0,!1,w,s,o),l.append("path").attr("class","railroad-line").attr("d",y.build()),u+=g.dimensions.height+this.config.verticalSeparation}return{element:l.node(),dimensions:{width:s,height:t,up:o,down:t-o}}}renderOptional(e,i){let n=this.renderExpression(e,i),r=this.config.arcRadius,t=r*2,a=n.dimensions.width+r*4,c=n.dimensions.height+t,s=e.append("g").attr("class","railroad-optional"),l=r*2,u=t;s.node().appendChild(n.element).setAttribute("transform",`translate(${l}, ${u})`);let o=u+n.dimensions.up,g=new x().moveTo(0,o).lineTo(r*2,o);s.append("path").attr("class","railroad-line").attr("d",g.build());let h=new x().moveTo(l+n.dimensions.width,o).lineTo(a,o);s.append("path").attr("class","railroad-line").attr("d",h.build());let p=new x().moveTo(0,o).arcTo(r,r,0,!1,!1,r,o-r).lineTo(r,r).arcTo(r,r,0,!1,!0,r*2,0).lineTo(a-r*2,0).arcTo(r,r,0,!1,!0,a-r,r).lineTo(a-r,o-r).arcTo(r,r,0,!1,!1,a,o);return s.append("path").attr("class","railroad-line").attr("d",p.build()),{element:s.node(),dimensions:{width:a,height:c,up:o,down:c-o}}}renderRepetition(e,i,n){let r=this.renderExpression(e,i),t=this.config.arcRadius,a=t*2,c=r.dimensions.width+t*4,s=n===0,l=r.dimensions.height+a+(s?a:0),u=e.append("g").attr("class","railroad-repetition"),o=t*2,g=s?a:0;u.node().appendChild(r.element).setAttribute("transform",`translate(${o}, ${g})`);let h=g+r.dimensions.up;u.append("path").attr("class","railroad-line").attr("d",new x().moveTo(0,h).lineTo(t*2,h).build()),u.append("path").attr("class","railroad-line").attr("d",new x().moveTo(o+r.dimensions.width,h).lineTo(c,h).build());let p=g+r.dimensions.height+t,k=new x().moveTo(o+r.dimensions.width,h).arcTo(t,t,0,!1,!0,o+r.dimensions.width+t,h+t).lineTo(o+r.dimensions.width+t,p).arcTo(t,t,0,!1,!0,o+r.dimensions.width,p+t).lineTo(t*2,p+t).arcTo(t,t,0,!1,!0,t,p).lineTo(t,h+t).arcTo(t,t,0,!1,!0,t*2,h);if(u.append("path").attr("class","railroad-line").attr("d",k.build()),s){let F=new x().moveTo(0,h).arcTo(t,t,0,!1,!1,t,h-t).lineTo(t,t).arcTo(t,t,0,!1,!0,t*2,0).lineTo(c-t*2,0).arcTo(t,t,0,!1,!0,c-t,t).lineTo(c-t,h-t).arcTo(t,t,0,!1,!1,c,h);u.append("path").attr("class","railroad-line").attr("d",F.build())}return{element:u.node(),dimensions:{width:c,height:l,up:h,down:l-h}}}renderSpecial(e,i){let n=this.measureText("? "+i+" ?"),r=n.width+this.config.padding*2,t=n.height+this.config.padding*2,a=e.append("g").attr("class","railroad-special");return a.append("rect").attr("x",0).attr("y",0).attr("width",r).attr("height",t),a.append("text").attr("x",r/2).attr("y",t/2).text("? "+i+" ?"),{element:a.node(),dimensions:{width:r,height:t,up:t/2,down:t/2}}}renderExpression(e,i){switch(i.type){case"terminal":return this.renderTerminal(e,i.value);case"nonterminal":return this.renderNonTerminal(e,i.name);case"sequence":return this.renderSequence(e,i.elements);case"choice":return this.renderChoice(e,i.alternatives);case"optional":return this.renderOptional(e,i.element);case"repetition":return this.renderRepetition(e,i.element,i.min);case"special":return this.renderSpecial(e,i.text);default:throw new Error(`Unknown node type: ${i.type}`)}}renderRule(e,i){let n=this.svg.append("g").attr("class","railroad-rule").attr("transform",`translate(0, ${i})`),r=e.name+" =",t=this.measureText(r).width+20,a=t+20,c=n.append("g"),s=this.renderExpression(c,e.definition),l=Math.max(20,s.dimensions.up),u=l-s.dimensions.up;return c.attr("transform",`translate(${a}, ${u})`),n.append("g").attr("class","railroad-rule-name-group").append("text").attr("class","railroad-rule-name").attr("x",0).attr("y",l).text(r),n.append("g").attr("class","railroad-start").append("circle").attr("cx",t).attr("cy",l).attr("r",this.config.markerRadius),n.append("g").attr("class","railroad-end").append("circle").attr("cx",a+s.dimensions.width+10).attr("cy",l).attr("r",this.config.markerRadius),n.append("path").attr("class","railroad-line").attr("d",new x().moveTo(t+this.config.markerRadius,l).lineTo(a,l).build()),n.append("path").attr("class","railroad-line").attr("d",new x().moveTo(a+s.dimensions.width,l).lineTo(a+s.dimensions.width+10-this.config.markerRadius,l).build()),{height:Math.max(40,u+s.dimensions.height+this.config.padding*2),width:a+s.dimensions.width+10+this.config.markerRadius}}renderDiagram(e){let i=this.config.padding,n=0;for(let r of e){let t=this.renderRule(r,i);i+=t.height+this.config.verticalSeparation,n=Math.max(n,t.width)}return{width:n+this.config.padding*2,height:i+this.config.padding}}},j=m((e,i,n)=>{O(e,i.height,i.width,n),e.attr("viewBox",`0 0 ${i.width} ${i.height}`)},"configureRailroadSvgSize"),ce=m((e,i,n)=>{f.debug(`[Railroad] Rendering diagram
`+e);try{let r=V(i);r.attr("class","railroad-diagram");let t=R().railroad?.useMaxWidth??!0,a=re.getRules();if(f.debug(`[Railroad] Rendering ${a.length} rules`),a.length===0){f.warn("[Railroad] No rules to render"),j(r,{height:100,width:200},t);return}let c=new me(r,A()).renderDiagram(a);j(r,c,t),f.debug("[Railroad] Render complete")}catch(r){throw f.error("[Railroad] Render error:",r),r}},"draw"),fe={draw:ce};export{re as a,Te as b,fe as c};
