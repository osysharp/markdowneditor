import{a as gt}from"./chunk-Y6QFOVEM.js";import{a as yt,b as dt,c as ft,f as Z}from"./chunk-A7GJM26B.js";import"./chunk-KYV6NIEV.js";import{O as at,T as st,U as ot,V as lt,W as ct,X as ht,Y as ut,Z as pt,_ as P}from"./chunk-FUV4E2MS.js";import{F as X,h as D}from"./chunk-XTASYECX.js";import{a}from"./chunk-2VB4RCU6.js";var K=(function(){var e=a(function(d,i,n,y){for(n=n||{},y=d.length;y--;n[d[y]]=i);return n},"o"),t=[6,8,10,11,12,14,16,17,18],o=[1,9],p=[1,10],r=[1,11],l=[1,12],c=[1,13],u=[1,14],f={trace:a(function(){},"trace"),yy:{},symbols_:{error:2,start:3,journey:4,document:5,EOF:6,line:7,SPACE:8,statement:9,NEWLINE:10,title:11,acc_title:12,acc_title_value:13,acc_descr:14,acc_descr_value:15,acc_descr_multiline_value:16,section:17,taskName:18,taskData:19,$accept:0,$end:1},terminals_:{2:"error",4:"journey",6:"EOF",8:"SPACE",10:"NEWLINE",11:"title",12:"acc_title",13:"acc_title_value",14:"acc_descr",15:"acc_descr_value",16:"acc_descr_multiline_value",17:"section",18:"taskName",19:"taskData"},productions_:[0,[3,3],[5,0],[5,2],[7,2],[7,1],[7,1],[7,1],[9,1],[9,2],[9,2],[9,1],[9,1],[9,2]],performAction:a(function(d,i,n,y,h,s,k){var x=s.length-1;switch(h){case 1:return s[x-1];case 2:this.$=[];break;case 3:s[x-1].push(s[x]),this.$=s[x-1];break;case 4:case 5:this.$=s[x];break;case 6:case 7:this.$=[];break;case 8:y.setDiagramTitle(s[x].substr(6)),this.$=s[x].substr(6);break;case 9:this.$=s[x].trim(),y.setAccTitle(this.$);break;case 10:case 11:this.$=s[x].trim(),y.setAccDescription(this.$);break;case 12:y.addSection(s[x].substr(8)),this.$=s[x].substr(8);break;case 13:y.addTask(s[x-1],s[x]),this.$="task";break}},"anonymous"),table:[{3:1,4:[1,2]},{1:[3]},e(t,[2,2],{5:3}),{6:[1,4],7:5,8:[1,6],9:7,10:[1,8],11:o,12:p,14:r,16:l,17:c,18:u},e(t,[2,7],{1:[2,1]}),e(t,[2,3]),{9:15,11:o,12:p,14:r,16:l,17:c,18:u},e(t,[2,5]),e(t,[2,6]),e(t,[2,8]),{13:[1,16]},{15:[1,17]},e(t,[2,11]),e(t,[2,12]),{19:[1,18]},e(t,[2,4]),e(t,[2,9]),e(t,[2,10]),e(t,[2,13])],defaultActions:{},parseError:a(function(d,i){if(i.recoverable)this.trace(d);else{var n=new Error(d);throw n.hash=i,n}},"parseError"),parse:a(function(d){var i=this,n=[0],y=[],h=[null],s=[],k=this.table,x="",C=0,j=0,et=0,St=2,it=1,Mt=s.slice.call(arguments,1),_=Object.create(this.lexer),A={yy:{}};for(var q in this.yy)Object.prototype.hasOwnProperty.call(this.yy,q)&&(A.yy[q]=this.yy[q]);_.setInput(d,A.yy),A.yy.lexer=_,A.yy.parser=this,typeof _.yylloc>"u"&&(_.yylloc={});var Y=_.yylloc;s.push(Y);var Tt=_.options&&_.options.ranges;typeof A.yy.parseError=="function"?this.parseError=A.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function Et(w){n.length=n.length-2*w,h.length=h.length-w,s.length=s.length-w}a(Et,"popStack");function nt(){var w;return w=y.pop()||_.lex()||it,typeof w!="number"&&(w instanceof Array&&(y=w,w=y.pop()),w=i.symbols_[w]||w),w}a(nt,"lex");for(var b,G,I,$,Zt,U,B={},V,M,rt,N;;){if(I=n[n.length-1],this.defaultActions[I]?$=this.defaultActions[I]:((b===null||typeof b>"u")&&(b=nt()),$=k[I]&&k[I][b]),typeof $>"u"||!$.length||!$[0]){var W="";N=[];for(V in k[I])this.terminals_[V]&&V>St&&N.push("'"+this.terminals_[V]+"'");_.showPosition?W="Parse error on line "+(C+1)+`:
`+_.showPosition()+`
Expecting `+N.join(", ")+", got '"+(this.terminals_[b]||b)+"'":W="Parse error on line "+(C+1)+": Unexpected "+(b==it?"end of input":"'"+(this.terminals_[b]||b)+"'"),this.parseError(W,{text:_.match,token:this.terminals_[b]||b,line:_.yylineno,loc:Y,expected:N})}if($[0]instanceof Array&&$.length>1)throw new Error("Parse Error: multiple actions possible at state: "+I+", token: "+b);switch($[0]){case 1:n.push(b),h.push(_.yytext),s.push(_.yylloc),n.push($[1]),b=null,G?(b=G,G=null):(j=_.yyleng,x=_.yytext,C=_.yylineno,Y=_.yylloc,et>0&&et--);break;case 2:if(M=this.productions_[$[1]][1],B.$=h[h.length-M],B._$={first_line:s[s.length-(M||1)].first_line,last_line:s[s.length-1].last_line,first_column:s[s.length-(M||1)].first_column,last_column:s[s.length-1].last_column},Tt&&(B._$.range=[s[s.length-(M||1)].range[0],s[s.length-1].range[1]]),U=this.performAction.apply(B,[x,j,C,A.yy,$[1],h,s].concat(Mt)),typeof U<"u")return U;M&&(n=n.slice(0,-1*M*2),h=h.slice(0,-1*M),s=s.slice(0,-1*M)),n.push(this.productions_[$[1]][0]),h.push(B.$),s.push(B._$),rt=k[n[n.length-2]][n[n.length-1]],n.push(rt);break;case 3:return!0}}return!0},"parse")},m=(function(){var d={EOF:1,parseError:a(function(i,n){if(this.yy.parser)this.yy.parser.parseError(i,n);else throw new Error(i)},"parseError"),setInput:a(function(i,n){return this.yy=n||this.yy||{},this._input=i,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:a(function(){var i=this._input[0];this.yytext+=i,this.yyleng++,this.offset++,this.match+=i,this.matched+=i;var n=i.match(/(?:\r\n?|\n).*/g);return n?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),i},"input"),unput:a(function(i){var n=i.length,y=i.split(/(?:\r\n?|\n)/g);this._input=i+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-n),this.offset-=n;var h=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),y.length-1&&(this.yylineno-=y.length-1);var s=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:y?(y.length===h.length?this.yylloc.first_column:0)+h[h.length-y.length].length-y[0].length:this.yylloc.first_column-n},this.options.ranges&&(this.yylloc.range=[s[0],s[0]+this.yyleng-n]),this.yyleng=this.yytext.length,this},"unput"),more:a(function(){return this._more=!0,this},"more"),reject:a(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:a(function(i){this.unput(this.match.slice(i))},"less"),pastInput:a(function(){var i=this.matched.substr(0,this.matched.length-this.match.length);return(i.length>20?"...":"")+i.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:a(function(){var i=this.match;return i.length<20&&(i+=this._input.substr(0,20-i.length)),(i.substr(0,20)+(i.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:a(function(){var i=this.pastInput(),n=new Array(i.length+1).join("-");return i+this.upcomingInput()+`
`+n+"^"},"showPosition"),test_match:a(function(i,n){var y,h,s;if(this.options.backtrack_lexer&&(s={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(s.yylloc.range=this.yylloc.range.slice(0))),h=i[0].match(/(?:\r\n?|\n).*/g),h&&(this.yylineno+=h.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:h?h[h.length-1].length-h[h.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+i[0].length},this.yytext+=i[0],this.match+=i[0],this.matches=i,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(i[0].length),this.matched+=i[0],y=this.performAction.call(this,this.yy,this,n,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),y)return y;if(this._backtrack){for(var k in s)this[k]=s[k];return!1}return!1},"test_match"),next:a(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var i,n,y,h;this._more||(this.yytext="",this.match="");for(var s=this._currentRules(),k=0;k<s.length;k++)if(y=this._input.match(this.rules[s[k]]),y&&(!n||y[0].length>n[0].length)){if(n=y,h=k,this.options.backtrack_lexer){if(i=this.test_match(y,s[k]),i!==!1)return i;if(this._backtrack){n=!1;continue}else return!1}else if(!this.options.flex)break}return n?(i=this.test_match(n,s[h]),i!==!1?i:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:a(function(){var i=this.next();return i||this.lex()},"lex"),begin:a(function(i){this.conditionStack.push(i)},"begin"),popState:a(function(){var i=this.conditionStack.length-1;return i>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:a(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:a(function(i){return i=this.conditionStack.length-1-Math.abs(i||0),i>=0?this.conditionStack[i]:"INITIAL"},"topState"),pushState:a(function(i){this.begin(i)},"pushState"),stateStackSize:a(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:a(function(i,n,y,h){var s=h;switch(y){case 0:break;case 1:break;case 2:return 10;case 3:break;case 4:break;case 5:return 4;case 6:return 11;case 7:return this.begin("acc_title"),12;case 8:return this.popState(),"acc_title_value";case 9:return this.begin("acc_descr"),14;case 10:return this.popState(),"acc_descr_value";case 11:this.begin("acc_descr_multiline");break;case 12:this.popState();break;case 13:return"acc_descr_multiline_value";case 14:return 17;case 15:return 18;case 16:return 19;case 17:return":";case 18:return 6;case 19:return"INVALID"}},"anonymous"),rules:[/^(?:%(?!\{)[^\n]*)/i,/^(?:[^\}]%%[^\n]*)/i,/^(?:[\n]+)/i,/^(?:\s+)/i,/^(?:#[^\n]*)/i,/^(?:journey\b)/i,/^(?:title\s[^#\n;]+)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:section\s[^#:\n;]+)/i,/^(?:[^#:\n;]+)/i,/^(?::[^#\n;]+)/i,/^(?::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{acc_descr_multiline:{rules:[12,13],inclusive:!1},acc_descr:{rules:[10],inclusive:!1},acc_title:{rules:[8],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,9,11,14,15,16,17,18,19],inclusive:!0}}};return d})();f.lexer=m;function g(){this.yy={}}return a(g,"Parser"),g.prototype=f,f.Parser=g,new g})();K.parser=K;var Ct=K,L="",H=[],O=[],R=[],At=a(function(){H.length=0,O.length=0,L="",R.length=0,st()},"clear"),It=a(function(e){L=e,H.push(e)},"addSection"),Pt=a(function(){return H},"getSections"),jt=a(function(){let e=mt(),t=100,o=0;for(;!e&&o<t;)e=mt(),o++;return O.push(...R),O},"getTasks"),Bt=a(function(){let e=[];return O.forEach(t=>{t.people&&e.push(...t.people)}),[...new Set(e)].sort()},"updateActors"),Lt=a(function(e,t){let o=t.substr(1).split(":"),p=0,r=[];o.length===1?(p=Number(o[0]),r=[]):(p=Number(o[0]),r=o[1].split(","));let l=r.map(u=>u.trim()),c={section:L,type:L,people:l,task:e,score:p};R.push(c)},"addTask"),Ot=a(function(e){let t={section:L,type:L,description:e,task:e,classes:[]};O.push(t)},"addTaskOrg"),mt=a(function(){let e=a(function(o){return R[o].processed},"compileTask"),t=!0;for(let[o,p]of R.entries())e(o),t=t&&p.processed;return t},"compileTasks"),Rt=a(function(){return Bt()},"getActors"),xt={getConfig:a(()=>P().journey,"getConfig"),clear:At,setDiagramTitle:ut,getDiagramTitle:pt,setAccTitle:ot,getAccTitle:lt,setAccDescription:ct,getAccDescription:ht,addSection:It,getSections:Pt,getTasks:jt,addTask:Lt,addTaskOrg:Ot,getActors:Rt},Ft=a(e=>`.label {
    font-family: ${e.fontFamily};
    color: ${e.textColor};
  }
  .mouth {
    stroke: #666;
  }

  line {
    stroke: ${e.textColor}
  }

  .legend {
    fill: ${e.textColor};
    font-family: ${e.fontFamily};
  }

  .label text {
    fill: #333;
  }
  .label {
    color: ${e.textColor}
  }

  .face {
    ${e.faceColor?`fill: ${e.faceColor}`:"fill: #FFF8DC"};
    stroke: #999;
  }

  .node rect,
  .node circle,
  .node ellipse,
  .node polygon,
  .node path {
    fill: ${e.mainBkg};
    stroke: ${e.nodeBorder};
    stroke-width: 1px;
  }

  .node .label {
    text-align: center;
  }
  .node.clickable {
    cursor: pointer;
  }

  .arrowheadPath {
    fill: ${e.arrowheadColor};
  }

  .edgePath .path {
    stroke: ${e.lineColor};
    stroke-width: 1.5px;
  }

  .flowchart-link {
    stroke: ${e.lineColor};
    fill: none;
  }

  .edgeLabel {
    background-color: ${e.edgeLabelBackground};
    rect {
      opacity: 0.5;
    }
    text-align: center;
  }

  .cluster rect {
  }

  .cluster text {
    fill: ${e.titleColor};
  }

  div.mermaidTooltip {
    position: absolute;
    text-align: center;
    max-width: 200px;
    padding: 2px;
    font-family: ${e.fontFamily};
    font-size: 12px;
    background: ${e.tertiaryColor};
    border: 1px solid ${e.border2};
    border-radius: 2px;
    pointer-events: none;
    z-index: 100;
  }

  .task-type-0, .section-type-0  {
    ${e.fillType0?`fill: ${e.fillType0}`:""};
  }
  .task-type-1, .section-type-1  {
    ${e.fillType0?`fill: ${e.fillType1}`:""};
  }
  .task-type-2, .section-type-2  {
    ${e.fillType0?`fill: ${e.fillType2}`:""};
  }
  .task-type-3, .section-type-3  {
    ${e.fillType0?`fill: ${e.fillType3}`:""};
  }
  .task-type-4, .section-type-4  {
    ${e.fillType0?`fill: ${e.fillType4}`:""};
  }
  .task-type-5, .section-type-5  {
    ${e.fillType0?`fill: ${e.fillType5}`:""};
  }
  .task-type-6, .section-type-6  {
    ${e.fillType0?`fill: ${e.fillType6}`:""};
  }
  .task-type-7, .section-type-7  {
    ${e.fillType0?`fill: ${e.fillType7}`:""};
  }

  .actor-0 {
    ${e.actor0?`fill: ${e.actor0}`:""};
  }
  .actor-1 {
    ${e.actor1?`fill: ${e.actor1}`:""};
  }
  .actor-2 {
    ${e.actor2?`fill: ${e.actor2}`:""};
  }
  .actor-3 {
    ${e.actor3?`fill: ${e.actor3}`:""};
  }
  .actor-4 {
    ${e.actor4?`fill: ${e.actor4}`:""};
  }
  .actor-5 {
    ${e.actor5?`fill: ${e.actor5}`:""};
  }
  ${gt()}
`,"getStyles"),Vt=Ft,tt=a(function(e,t){return yt(e,t)},"drawRect"),Nt=a(function(e,t){let o=e.append("circle").attr("cx",t.cx).attr("cy",t.cy).attr("class","face").attr("r",15).attr("stroke-width",2).attr("overflow","visible"),p=e.append("g");p.append("circle").attr("cx",t.cx-15/3).attr("cy",t.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666"),p.append("circle").attr("cx",t.cx+15/3).attr("cy",t.cy-15/3).attr("r",1.5).attr("stroke-width",2).attr("fill","#666").attr("stroke","#666");function r(u){let f=X().startAngle(Math.PI/2).endAngle(3*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);u.append("path").attr("class","mouth").attr("d",f).attr("transform","translate("+t.cx+","+(t.cy+2)+")")}a(r,"smile");function l(u){let f=X().startAngle(3*Math.PI/2).endAngle(5*(Math.PI/2)).innerRadius(7.5).outerRadius(6.8181818181818175);u.append("path").attr("class","mouth").attr("d",f).attr("transform","translate("+t.cx+","+(t.cy+7)+")")}a(l,"sad");function c(u){u.append("line").attr("class","mouth").attr("stroke",2).attr("x1",t.cx-5).attr("y1",t.cy+7).attr("x2",t.cx+5).attr("y2",t.cy+7).attr("class","mouth").attr("stroke-width","1px").attr("stroke","#666")}return a(c,"ambivalent"),t.score>3?r(p):t.score<3?l(p):c(p),o},"drawFace"),bt=a(function(e,t){let o=e.append("circle");return o.attr("cx",t.cx),o.attr("cy",t.cy),o.attr("class","actor-"+t.pos),o.attr("fill",t.fill),o.attr("stroke",t.stroke),o.attr("r",t.r),o.class!==void 0&&o.attr("class",o.class),t.title!==void 0&&o.append("title").text(t.title),o},"drawCircle"),wt=a(function(e,t){return ft(e,t)},"drawText"),Dt=a(function(e,t){function o(r,l,c,u,f){return r+","+l+" "+(r+c)+","+l+" "+(r+c)+","+(l+u-f)+" "+(r+c-f*1.2)+","+(l+u)+" "+r+","+(l+u)}a(o,"genPoints");let p=e.append("polygon");p.attr("points",o(t.x,t.y,50,20,7)),p.attr("class","labelBox"),t.y=t.y+t.labelMargin,t.x=t.x+.5*t.labelMargin,wt(e,t)},"drawLabel"),zt=a(function(e,t,o){let p=e.append("g"),r=Z();r.x=t.x,r.y=t.y,r.fill=t.fill,r.width=o.width*t.taskCount+o.diagramMarginX*(t.taskCount-1),r.height=o.height,r.class="journey-section section-type-"+t.num,r.rx=3,r.ry=3,tt(p,r),$t(o)(t.text,p,r.x,r.y,r.width,r.height,{class:"journey-section section-type-"+t.num},o,t.colour)},"drawSection"),Q=-1,qt=a(function(e,t,o,p){let r=t.x+o.width/2,l=e.append("g");Q++,l.append("line").attr("id",p+"-task"+Q).attr("x1",r).attr("y1",t.y).attr("x2",r).attr("y2",450).attr("class","task-line").attr("stroke-width","1px").attr("stroke-dasharray","4 2").attr("stroke","#666"),Nt(l,{cx:r,cy:300+(5-t.score)*30,score:t.score});let c=Z();c.x=t.x,c.y=t.y,c.fill=t.fill,c.width=o.width,c.height=o.height,c.class="task task-type-"+t.num,c.rx=3,c.ry=3,tt(l,c);let u=t.x+14;t.people.forEach(f=>{let m=t.actors[f].color,g={cx:u,cy:t.y,r:7,fill:m,stroke:"#000",title:f,pos:t.actors[f].position};bt(l,g),u+=10}),$t(o)(t.task,l,c.x,c.y,c.width,c.height,{class:"task"},o,t.colour)},"drawTask"),Yt=a(function(e,t){dt(e,t)},"drawBackgroundRect"),$t=(function(){function e(r,l,c,u,f,m,g,d){let i=l.append("text").attr("x",c+f/2).attr("y",u+m/2+5).style("font-color",d).style("text-anchor","middle").text(r);p(i,g)}a(e,"byText");function t(r,l,c,u,f,m,g,d,i){let{taskFontSize:n,taskFontFamily:y}=d,h=r.split(/<br\s*\/?>/gi);for(let s=0;s<h.length;s++){let k=s*n-n*(h.length-1)/2,x=l.append("text").attr("x",c+f/2).attr("y",u).attr("fill",i).style("text-anchor","middle").style("font-size",n).style("font-family",y);x.append("tspan").attr("x",c+f/2).attr("dy",k).text(h[s]),x.attr("y",u+m/2).attr("dominant-baseline","central").attr("alignment-baseline","central"),p(x,g)}}a(t,"byTspan");function o(r,l,c,u,f,m,g,d){let i=l.append("switch"),n=i.append("foreignObject").attr("x",c).attr("y",u).attr("width",f).attr("height",m).attr("position","fixed").append("xhtml:div").style("display","table").style("height","100%").style("width","100%");n.append("div").attr("class","label").style("display","table-cell").style("text-align","center").style("vertical-align","middle").text(r),t(r,i,c,u,f,m,g,d),p(n,g)}a(o,"byFo");function p(r,l){for(let c in l)c in l&&r.attr(c,l[c])}return a(p,"_setTextAttrs"),function(r){return r.textPlacement==="fo"?o:r.textPlacement==="old"?e:t}})(),Gt=a(function(e,t){Q=-1,e.append("defs").append("marker").attr("id",t+"-arrowhead").attr("refX",5).attr("refY",2).attr("markerWidth",6).attr("markerHeight",4).attr("orient","auto").append("path").attr("d","M 0,0 V 4 L6,2 Z")},"initGraphics"),F={drawRect:tt,drawCircle:bt,drawSection:zt,drawText:wt,drawLabel:Dt,drawTask:qt,drawBackgroundRect:Yt,initGraphics:Gt},Ut=a(function(e){Object.keys(e).forEach(function(t){S[t]=e[t]})},"setConf"),T={},z=0;function vt(e){let t=P().journey,o=t.maxLabelWidth;z=0;let p=60;Object.keys(T).forEach(r=>{let l=T[r].color,c={cx:20,cy:p,r:7,fill:l,stroke:"#000",pos:T[r].position};F.drawCircle(e,c);let u=e.append("text").attr("visibility","hidden").text(r),f=u.node().getBoundingClientRect().width;u.remove();let m=[];if(f<=o)m=[r];else{let g=r.split(" "),d="";u=e.append("text").attr("visibility","hidden"),g.forEach(i=>{let n=d?`${d} ${i}`:i;if(u.text(n),u.node().getBoundingClientRect().width>o){if(d&&m.push(d),d=i,u.text(i),u.node().getBoundingClientRect().width>o){let y="";for(let h of i)y+=h,u.text(y+"-"),u.node().getBoundingClientRect().width>o&&(m.push(y.slice(0,-1)+"-"),y=h);d=y}}else d=n}),d&&m.push(d),u.remove()}m.forEach((g,d)=>{let i={x:40,y:p+7+d*20,fill:"#666",text:g,textMargin:t.boxTextMargin??5},n=F.drawText(e,i).node().getBoundingClientRect().width;n>z&&n>t.leftMargin-n&&(z=n)}),p+=Math.max(20,m.length*20)})}a(vt,"drawActorLegend");var S=P().journey,E=0,Wt=a(function(e,t,o,p){let r=P(),l=r.journey.titleColor,c=r.journey.titleFontSize,u=r.journey.titleFontFamily,f=r.securityLevel,m;f==="sandbox"&&(m=D("#i"+t));let g=f==="sandbox"?D(m.nodes()[0].contentDocument.body):D("body");v.init();let d=g.select("#"+t);F.initGraphics(d,t);let i=p.db.getTasks(),n=p.db.getDiagramTitle(),y=p.db.getActors();for(let j in T)delete T[j];let h=0;y.forEach(j=>{T[j]={color:S.actorColours[h%S.actorColours.length],position:h},h++}),vt(d),E=S.leftMargin+z,v.insert(0,0,E,Object.keys(T).length*50),Xt(d,i,0,t);let s=v.getBounds();n&&d.append("text").text(n).attr("x",E).attr("font-size",c).attr("font-weight","bold").attr("y",25).attr("fill",l).attr("font-family",u);let k=s.stopy-s.starty+2*S.diagramMarginY,x=E+s.stopx+2*S.diagramMarginX;at(d,k,x,S.useMaxWidth),d.append("line").attr("x1",E).attr("y1",S.height*4).attr("x2",x-E-4).attr("y2",S.height*4).attr("stroke-width",4).attr("stroke","black").attr("marker-end","url(#"+t+"-arrowhead)");let C=n?70:0;d.attr("viewBox",`${s.startx} -25 ${x} ${k+C}`),d.attr("preserveAspectRatio","xMinYMin meet"),d.attr("height",k+C+25)},"draw"),v={data:{startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},verticalPos:0,sequenceItems:[],init:a(function(){this.sequenceItems=[],this.data={startx:void 0,stopx:void 0,starty:void 0,stopy:void 0},this.verticalPos=0},"init"),updateVal:a(function(e,t,o,p){e[t]===void 0?e[t]=o:e[t]=p(o,e[t])},"updateVal"),updateBounds:a(function(e,t,o,p){let r=P().journey,l=this,c=0;function u(f){return a(function(m){c++;let g=l.sequenceItems.length-c+1;l.updateVal(m,"starty",t-g*r.boxMargin,Math.min),l.updateVal(m,"stopy",p+g*r.boxMargin,Math.max),l.updateVal(v.data,"startx",e-g*r.boxMargin,Math.min),l.updateVal(v.data,"stopx",o+g*r.boxMargin,Math.max),f!=="activation"&&(l.updateVal(m,"startx",e-g*r.boxMargin,Math.min),l.updateVal(m,"stopx",o+g*r.boxMargin,Math.max),l.updateVal(v.data,"starty",t-g*r.boxMargin,Math.min),l.updateVal(v.data,"stopy",p+g*r.boxMargin,Math.max))},"updateItemBounds")}a(u,"updateFn"),this.sequenceItems.forEach(u())},"updateBounds"),insert:a(function(e,t,o,p){let r=Math.min(e,o),l=Math.max(e,o),c=Math.min(t,p),u=Math.max(t,p);this.updateVal(v.data,"startx",r,Math.min),this.updateVal(v.data,"starty",c,Math.min),this.updateVal(v.data,"stopx",l,Math.max),this.updateVal(v.data,"stopy",u,Math.max),this.updateBounds(r,c,l,u)},"insert"),bumpVerticalPos:a(function(e){this.verticalPos=this.verticalPos+e,this.data.stopy=this.verticalPos},"bumpVerticalPos"),getVerticalPos:a(function(){return this.verticalPos},"getVerticalPos"),getBounds:a(function(){return this.data},"getBounds")},J=S.sectionFills,kt=S.sectionColours,Xt=a(function(e,t,o,p){let r=P().journey,l="",c=r.height*2+r.diagramMarginY,u=o+c,f=0,m="#CCC",g="black",d=0;for(let[i,n]of t.entries()){if(l!==n.section){m=J[f%J.length],d=f%J.length,g=kt[f%kt.length];let h=0,s=n.section;for(let x=i;x<t.length&&t[x].section==s;x++)h=h+1;let k={x:i*r.taskMargin+i*r.width+E,y:50,text:n.section,fill:m,num:d,colour:g,taskCount:h};F.drawSection(e,k,r),l=n.section,f++}let y=n.people.reduce((h,s)=>(T[s]&&(h[s]=T[s]),h),{});n.x=i*r.taskMargin+i*r.width+E,n.y=u,n.width=r.diagramMarginX,n.height=r.diagramMarginY,n.colour=g,n.fill=m,n.num=d,n.actors=y,F.drawTask(e,n,r,p),v.insert(n.x,n.y,n.x+n.width+r.taskMargin,450)}},"drawTasks"),_t={setConf:Ut,draw:Wt},ie={parser:Ct,db:xt,renderer:_t,styles:Vt,init:a(e=>{_t.setConf(e.journey),xt.clear()},"init")};export{ie as diagram};
