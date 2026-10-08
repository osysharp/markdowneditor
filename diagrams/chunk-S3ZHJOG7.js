import{a as Wt}from"./chunk-3BQBH5DF.js";import{a as Mt}from"./chunk-HI5UFTL4.js";import{b as Gt}from"./chunk-P6XCRWBO.js";import{h as zt}from"./chunk-A7GJM26B.js";import{g as Yt,p as jt}from"./chunk-CDE7BSEC.js";import{F as At,N as G,T as wt,U as Nt,V as Ot,W as Rt,X as Ft,Y as Bt,Z as Pt,_ as N}from"./chunk-FUV4E2MS.js";import{b,h as pt}from"./chunk-XTASYECX.js";import{a as d}from"./chunk-2VB4RCU6.js";var $t=(function(){var t=d(function(F,a,r,y){for(r=r||{},y=F.length;y--;r[F[y]]=a);return r},"o"),e=[1,2],n=[1,3],s=[1,4],h=[2,4],c=[1,9],g=[1,11],f=[1,16],l=[1,17],m=[1,18],E=[1,19],D=[1,33],$=[1,20],O=[1,21],u=[1,22],k=[1,23],L=[1,24],I=[1,26],B=[1,27],_=[1,28],R=[1,29],tt=[1,30],et=[1,31],st=[1,32],it=[1,35],rt=[1,36],at=[1,37],nt=[1,38],U=[1,34],p=[1,4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],ot=[1,4,5,14,15,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,39,40,41,45,48,51,52,53,54,57],vt=[4,5,16,17,19,21,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],ft={trace:d(function(){},"trace"),yy:{},symbols_:{error:2,start:3,SPACE:4,NL:5,SD:6,document:7,line:8,statement:9,classDefStatement:10,styleStatement:11,cssClassStatement:12,idStatement:13,DESCR:14,"-->":15,HIDE_EMPTY:16,scale:17,WIDTH:18,COMPOSIT_STATE:19,STRUCT_START:20,STRUCT_STOP:21,STATE_DESCR:22,AS:23,ID:24,FORK:25,JOIN:26,CHOICE:27,CONCURRENT:28,note:29,notePosition:30,NOTE_TEXT:31,direction:32,acc_title:33,acc_title_value:34,acc_descr:35,acc_descr_value:36,acc_descr_multiline_value:37,CLICK:38,STRING:39,HREF:40,classDef:41,CLASSDEF_ID:42,CLASSDEF_STYLEOPTS:43,DEFAULT:44,style:45,STYLE_IDS:46,STYLEDEF_STYLEOPTS:47,class:48,CLASSENTITY_IDS:49,STYLECLASS:50,direction_tb:51,direction_bt:52,direction_rl:53,direction_lr:54,eol:55,";":56,EDGE_STATE:57,STYLE_SEPARATOR:58,left_of:59,right_of:60,$accept:0,$end:1},terminals_:{2:"error",4:"SPACE",5:"NL",6:"SD",14:"DESCR",15:"-->",16:"HIDE_EMPTY",17:"scale",18:"WIDTH",19:"COMPOSIT_STATE",20:"STRUCT_START",21:"STRUCT_STOP",22:"STATE_DESCR",23:"AS",24:"ID",25:"FORK",26:"JOIN",27:"CHOICE",28:"CONCURRENT",29:"note",31:"NOTE_TEXT",33:"acc_title",34:"acc_title_value",35:"acc_descr",36:"acc_descr_value",37:"acc_descr_multiline_value",38:"CLICK",39:"STRING",40:"HREF",41:"classDef",42:"CLASSDEF_ID",43:"CLASSDEF_STYLEOPTS",44:"DEFAULT",45:"style",46:"STYLE_IDS",47:"STYLEDEF_STYLEOPTS",48:"class",49:"CLASSENTITY_IDS",50:"STYLECLASS",51:"direction_tb",52:"direction_bt",53:"direction_rl",54:"direction_lr",56:";",57:"EDGE_STATE",58:"STYLE_SEPARATOR",59:"left_of",60:"right_of"},productions_:[0,[3,2],[3,2],[3,2],[7,0],[7,2],[8,2],[8,1],[8,1],[9,1],[9,1],[9,1],[9,1],[9,2],[9,3],[9,4],[9,1],[9,2],[9,1],[9,4],[9,3],[9,6],[9,1],[9,1],[9,1],[9,1],[9,4],[9,4],[9,1],[9,2],[9,2],[9,1],[9,5],[9,5],[10,3],[10,3],[11,3],[12,3],[32,1],[32,1],[32,1],[32,1],[55,1],[55,1],[13,1],[13,1],[13,3],[13,3],[30,1],[30,1]],performAction:d(function(F,a,r,y,S,i,C){var o=i.length-1;switch(S){case 3:return y.setRootDoc(i[o]),i[o];case 4:this.$=[];break;case 5:i[o]!="nl"&&(i[o-1].push(i[o]),this.$=i[o-1]);break;case 6:case 7:this.$=i[o];break;case 8:this.$="nl";break;case 12:this.$=i[o];break;case 13:let ct=i[o-1];ct.description=y.trimColon(i[o]),this.$=ct;break;case 14:this.$={stmt:"relation",state1:i[o-2],state2:i[o]};break;case 15:let ht=y.trimColon(i[o]);this.$={stmt:"relation",state1:i[o-3],state2:i[o-1],description:ht};break;case 19:this.$={stmt:"state",id:i[o-3],type:"default",description:"",doc:i[o-1]};break;case 20:var P=i[o],Y=i[o-2].trim();if(i[o].match(":")){var V=i[o].split(":");P=V[0],Y=[Y,V[1]]}this.$={stmt:"state",id:P,type:"default",description:Y};break;case 21:this.$={stmt:"state",id:i[o-3],type:"default",description:i[o-5],doc:i[o-1]};break;case 22:this.$={stmt:"state",id:i[o],type:"fork"};break;case 23:this.$={stmt:"state",id:i[o],type:"join"};break;case 24:this.$={stmt:"state",id:i[o],type:"choice"};break;case 25:this.$={stmt:"state",id:y.getDividerId(),type:"divider"};break;case 26:this.$={stmt:"state",id:i[o-1].trim(),note:{position:i[o-2].trim(),text:i[o].trim()}};break;case 29:this.$=i[o].trim(),y.setAccTitle(this.$);break;case 30:case 31:this.$=i[o].trim(),y.setAccDescription(this.$);break;case 32:this.$={stmt:"click",id:i[o-3],url:i[o-2],tooltip:i[o-1]};break;case 33:this.$={stmt:"click",id:i[o-3],url:i[o-1],tooltip:""};break;case 34:case 35:this.$={stmt:"classDef",id:i[o-1].trim(),classes:i[o].trim()};break;case 36:this.$={stmt:"style",id:i[o-1].trim(),styleClass:i[o].trim()};break;case 37:this.$={stmt:"applyClass",id:i[o-1].trim(),styleClass:i[o].trim()};break;case 38:y.setDirection("TB"),this.$={stmt:"dir",value:"TB"};break;case 39:y.setDirection("BT"),this.$={stmt:"dir",value:"BT"};break;case 40:y.setDirection("RL"),this.$={stmt:"dir",value:"RL"};break;case 41:y.setDirection("LR"),this.$={stmt:"dir",value:"LR"};break;case 44:case 45:this.$={stmt:"state",id:i[o].trim(),type:"default",description:""};break;case 46:this.$={stmt:"state",id:i[o-2].trim(),classes:[i[o].trim()],type:"default",description:""};break;case 47:this.$={stmt:"state",id:i[o-2].trim(),classes:[i[o].trim()],type:"default",description:""};break}},"anonymous"),table:[{3:1,4:e,5:n,6:s},{1:[3]},{3:5,4:e,5:n,6:s},{3:6,4:e,5:n,6:s},t([1,4,5,16,17,19,22,24,25,26,27,28,29,33,35,37,38,41,45,48,51,52,53,54,57],h,{7:7}),{1:[2,1]},{1:[2,2]},{1:[2,3],4:c,5:g,8:8,9:10,10:12,11:13,12:14,13:15,16:f,17:l,19:m,22:E,24:D,25:$,26:O,27:u,28:k,29:L,32:25,33:I,35:B,37:_,38:R,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(p,[2,5]),{9:39,10:12,11:13,12:14,13:15,16:f,17:l,19:m,22:E,24:D,25:$,26:O,27:u,28:k,29:L,32:25,33:I,35:B,37:_,38:R,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(p,[2,7]),t(p,[2,8]),t(p,[2,9]),t(p,[2,10]),t(p,[2,11]),t(p,[2,12],{14:[1,40],15:[1,41]}),t(p,[2,16]),{18:[1,42]},t(p,[2,18],{20:[1,43]}),{23:[1,44]},t(p,[2,22]),t(p,[2,23]),t(p,[2,24]),t(p,[2,25]),{30:45,31:[1,46],59:[1,47],60:[1,48]},t(p,[2,28]),{34:[1,49]},{36:[1,50]},t(p,[2,31]),{13:51,24:D,57:U},{42:[1,52],44:[1,53]},{46:[1,54]},{49:[1,55]},t(ot,[2,44],{58:[1,56]}),t(ot,[2,45],{58:[1,57]}),t(p,[2,38]),t(p,[2,39]),t(p,[2,40]),t(p,[2,41]),t(p,[2,6]),t(p,[2,13]),{13:58,24:D,57:U},t(p,[2,17]),t(vt,h,{7:59}),{24:[1,60]},{24:[1,61]},{23:[1,62]},{24:[2,48]},{24:[2,49]},t(p,[2,29]),t(p,[2,30]),{39:[1,63],40:[1,64]},{43:[1,65]},{43:[1,66]},{47:[1,67]},{50:[1,68]},{24:[1,69]},{24:[1,70]},t(p,[2,14],{14:[1,71]}),{4:c,5:g,8:8,9:10,10:12,11:13,12:14,13:15,16:f,17:l,19:m,21:[1,72],22:E,24:D,25:$,26:O,27:u,28:k,29:L,32:25,33:I,35:B,37:_,38:R,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(p,[2,20],{20:[1,73]}),{31:[1,74]},{24:[1,75]},{39:[1,76]},{39:[1,77]},t(p,[2,34]),t(p,[2,35]),t(p,[2,36]),t(p,[2,37]),t(ot,[2,46]),t(ot,[2,47]),t(p,[2,15]),t(p,[2,19]),t(vt,h,{7:78}),t(p,[2,26]),t(p,[2,27]),{5:[1,79]},{5:[1,80]},{4:c,5:g,8:8,9:10,10:12,11:13,12:14,13:15,16:f,17:l,19:m,21:[1,81],22:E,24:D,25:$,26:O,27:u,28:k,29:L,32:25,33:I,35:B,37:_,38:R,41:tt,45:et,48:st,51:it,52:rt,53:at,54:nt,57:U},t(p,[2,32]),t(p,[2,33]),t(p,[2,21])],defaultActions:{5:[2,1],6:[2,2],47:[2,48],48:[2,49]},parseError:d(function(F,a){if(a.recoverable)this.trace(F);else{var r=new Error(F);throw r.hash=a,r}},"parseError"),parse:d(function(F){var a=this,r=[0],y=[],S=[null],i=[],C=this.table,o="",P=0,Y=0,V=0,ct=2,ht=1,ce=i.slice.call(arguments,1),T=Object.create(this.lexer),W={yy:{}};for(var St in this.yy)Object.prototype.hasOwnProperty.call(this.yy,St)&&(W.yy[St]=this.yy[St]);T.setInput(F,W.yy),W.yy.lexer=T,W.yy.parser=this,typeof T.yylloc>"u"&&(T.yylloc={});var bt=T.yylloc;i.push(bt);var he=T.options&&T.options.ranges;typeof W.yy.parseError=="function"?this.parseError=W.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;function de(A){r.length=r.length-2*A,S.length=S.length-A,i.length=i.length-A}d(de,"popStack");function Lt(){var A;return A=y.pop()||T.lex()||ht,typeof A!="number"&&(A instanceof Array&&(y=A,A=y.pop()),A=a.symbols_[A]||A),A}d(Lt,"lex");for(var x,kt,M,w,Fe,Tt,K={},dt,j,It,ut;;){if(M=r[r.length-1],this.defaultActions[M]?w=this.defaultActions[M]:((x===null||typeof x>"u")&&(x=Lt()),w=C[M]&&C[M][x]),typeof w>"u"||!w.length||!w[0]){var _t="";ut=[];for(dt in C[M])this.terminals_[dt]&&dt>ct&&ut.push("'"+this.terminals_[dt]+"'");T.showPosition?_t="Parse error on line "+(P+1)+`:
`+T.showPosition()+`
Expecting `+ut.join(", ")+", got '"+(this.terminals_[x]||x)+"'":_t="Parse error on line "+(P+1)+": Unexpected "+(x==ht?"end of input":"'"+(this.terminals_[x]||x)+"'"),this.parseError(_t,{text:T.match,token:this.terminals_[x]||x,line:T.yylineno,loc:bt,expected:ut})}if(w[0]instanceof Array&&w.length>1)throw new Error("Parse Error: multiple actions possible at state: "+M+", token: "+x);switch(w[0]){case 1:r.push(x),S.push(T.yytext),i.push(T.yylloc),r.push(w[1]),x=null,kt?(x=kt,kt=null):(Y=T.yyleng,o=T.yytext,P=T.yylineno,bt=T.yylloc,V>0&&V--);break;case 2:if(j=this.productions_[w[1]][1],K.$=S[S.length-j],K._$={first_line:i[i.length-(j||1)].first_line,last_line:i[i.length-1].last_line,first_column:i[i.length-(j||1)].first_column,last_column:i[i.length-1].last_column},he&&(K._$.range=[i[i.length-(j||1)].range[0],i[i.length-1].range[1]]),Tt=this.performAction.apply(K,[o,Y,P,W.yy,w[1],S,i].concat(ce)),typeof Tt<"u")return Tt;j&&(r=r.slice(0,-1*j*2),S=S.slice(0,-1*j),i=i.slice(0,-1*j)),r.push(this.productions_[w[1]][0]),S.push(K.$),i.push(K._$),It=C[r[r.length-2]][r[r.length-1]],r.push(It);break;case 3:return!0}}return!0},"parse")},le=(function(){var F={EOF:1,parseError:d(function(a,r){if(this.yy.parser)this.yy.parser.parseError(a,r);else throw new Error(a)},"parseError"),setInput:d(function(a,r){return this.yy=r||this.yy||{},this._input=a,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},"setInput"),input:d(function(){var a=this._input[0];this.yytext+=a,this.yyleng++,this.offset++,this.match+=a,this.matched+=a;var r=a.match(/(?:\r\n?|\n).*/g);return r?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),a},"input"),unput:d(function(a){var r=a.length,y=a.split(/(?:\r\n?|\n)/g);this._input=a+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-r),this.offset-=r;var S=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),y.length-1&&(this.yylineno-=y.length-1);var i=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:y?(y.length===S.length?this.yylloc.first_column:0)+S[S.length-y.length].length-y[0].length:this.yylloc.first_column-r},this.options.ranges&&(this.yylloc.range=[i[0],i[0]+this.yyleng-r]),this.yyleng=this.yytext.length,this},"unput"),more:d(function(){return this._more=!0,this},"more"),reject:d(function(){if(this.options.backtrack_lexer)this._backtrack=!0;else return this.parseError("Lexical error on line "+(this.yylineno+1)+`. You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).
`+this.showPosition(),{text:"",token:null,line:this.yylineno});return this},"reject"),less:d(function(a){this.unput(this.match.slice(a))},"less"),pastInput:d(function(){var a=this.matched.substr(0,this.matched.length-this.match.length);return(a.length>20?"...":"")+a.substr(-20).replace(/\n/g,"")},"pastInput"),upcomingInput:d(function(){var a=this.match;return a.length<20&&(a+=this._input.substr(0,20-a.length)),(a.substr(0,20)+(a.length>20?"...":"")).replace(/\n/g,"")},"upcomingInput"),showPosition:d(function(){var a=this.pastInput(),r=new Array(a.length+1).join("-");return a+this.upcomingInput()+`
`+r+"^"},"showPosition"),test_match:d(function(a,r){var y,S,i;if(this.options.backtrack_lexer&&(i={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(i.yylloc.range=this.yylloc.range.slice(0))),S=a[0].match(/(?:\r\n?|\n).*/g),S&&(this.yylineno+=S.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:S?S[S.length-1].length-S[S.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+a[0].length},this.yytext+=a[0],this.match+=a[0],this.matches=a,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(a[0].length),this.matched+=a[0],y=this.performAction.call(this,this.yy,this,r,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),y)return y;if(this._backtrack){for(var C in i)this[C]=i[C];return!1}return!1},"test_match"),next:d(function(){if(this.done)return this.EOF;this._input||(this.done=!0);var a,r,y,S;this._more||(this.yytext="",this.match="");for(var i=this._currentRules(),C=0;C<i.length;C++)if(y=this._input.match(this.rules[i[C]]),y&&(!r||y[0].length>r[0].length)){if(r=y,S=C,this.options.backtrack_lexer){if(a=this.test_match(y,i[C]),a!==!1)return a;if(this._backtrack){r=!1;continue}else return!1}else if(!this.options.flex)break}return r?(a=this.test_match(r,i[S]),a!==!1?a:!1):this._input===""?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+`. Unrecognized text.
`+this.showPosition(),{text:"",token:null,line:this.yylineno})},"next"),lex:d(function(){var a=this.next();return a||this.lex()},"lex"),begin:d(function(a){this.conditionStack.push(a)},"begin"),popState:d(function(){var a=this.conditionStack.length-1;return a>0?this.conditionStack.pop():this.conditionStack[0]},"popState"),_currentRules:d(function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},"_currentRules"),topState:d(function(a){return a=this.conditionStack.length-1-Math.abs(a||0),a>=0?this.conditionStack[a]:"INITIAL"},"topState"),pushState:d(function(a){this.begin(a)},"pushState"),stateStackSize:d(function(){return this.conditionStack.length},"stateStackSize"),options:{"case-insensitive":!0},performAction:d(function(a,r,y,S){function i(){let o=r.yytext.indexOf("%%");if(o===0)return!1;if(o>0){let P=r.yytext.slice(0,o),Y=r.yytext.slice(o);Y&&a.lexer.unput(Y),r.yytext=P}return!0}d(i,"processId");var C=S;switch(y){case 0:return 38;case 1:return 40;case 2:return 39;case 3:return 44;case 4:return 51;case 5:return 52;case 6:return 53;case 7:return 54;case 8:return 5;case 9:break;case 10:break;case 11:break;case 12:break;case 13:return this.pushState("SCALE"),17;case 14:return 18;case 15:this.popState();break;case 16:return this.begin("acc_title"),33;case 17:return this.popState(),"acc_title_value";case 18:return this.begin("acc_descr"),35;case 19:return this.popState(),"acc_descr_value";case 20:this.begin("acc_descr_multiline");break;case 21:this.popState();break;case 22:return"acc_descr_multiline_value";case 23:return this.pushState("CLASSDEF"),41;case 24:return this.popState(),this.pushState("CLASSDEFID"),"DEFAULT_CLASSDEF_ID";case 25:return this.popState(),this.pushState("CLASSDEFID"),42;case 26:return this.popState(),43;case 27:return this.pushState("CLASS"),48;case 28:return this.popState(),this.pushState("CLASS_STYLE"),49;case 29:return this.popState(),50;case 30:return this.pushState("STYLE"),45;case 31:return this.popState(),this.pushState("STYLEDEF_STYLES"),46;case 32:return this.popState(),47;case 33:return this.pushState("SCALE"),17;case 34:return 18;case 35:this.popState();break;case 36:this.pushState("STATE");break;case 37:return this.popState(),r.yytext=r.yytext.slice(0,-8).trim(),25;case 38:return this.popState(),r.yytext=r.yytext.slice(0,-8).trim(),26;case 39:return this.popState(),r.yytext=r.yytext.slice(0,-10).trim(),27;case 40:return this.popState(),r.yytext=r.yytext.slice(0,-8).trim(),25;case 41:return this.popState(),r.yytext=r.yytext.slice(0,-8).trim(),26;case 42:return this.popState(),r.yytext=r.yytext.slice(0,-10).trim(),27;case 43:return 51;case 44:return 52;case 45:return 53;case 46:return 54;case 47:this.pushState("STATE_STRING");break;case 48:return this.pushState("STATE_ID"),"AS";case 49:return i()?(this.popState(),"ID"):void 0;case 50:this.popState();break;case 51:return"STATE_DESCR";case 52:throw new Error('Error: State name must be a single word. Found: "'+r.yytext.trim()+'"');case 53:return 19;case 54:this.popState();break;case 55:return this.popState(),this.pushState("struct"),20;case 56:return this.popState(),21;case 57:break;case 58:return this.begin("NOTE"),29;case 59:return this.popState(),this.pushState("NOTE_ID"),59;case 60:return this.popState(),this.pushState("NOTE_ID"),60;case 61:this.popState(),this.pushState("FLOATING_NOTE");break;case 62:return this.popState(),this.pushState("FLOATING_NOTE_ID"),"AS";case 63:break;case 64:return"NOTE_TEXT";case 65:return i()?(this.popState(),"ID"):void 0;case 66:return i()?(this.popState(),this.pushState("NOTE_TEXT"),24):void 0;case 67:return this.popState(),r.yytext=r.yytext.substr(2).trim(),31;case 68:return this.popState(),r.yytext=r.yytext.slice(0,-8).trim(),31;case 69:return 6;case 70:return 6;case 71:return 16;case 72:return 57;case 73:return i()?24:void 0;case 74:return r.yytext=r.yytext.trim(),14;case 75:return 15;case 76:return 28;case 77:return 58;case 78:return 5;case 79:return"INVALID"}},"anonymous"),rules:[/^(?:click\b)/i,/^(?:href\b)/i,/^(?:"[^"]*")/i,/^(?:default\b)/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:[\n]+)/i,/^(?:[\s]+)/i,/^(?:((?!\n)\s)+)/i,/^(?:#[^\n]*)/i,/^(?:%%(?!\{)[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:accTitle\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*:\s*)/i,/^(?:(?!\n||)*[^\n]*)/i,/^(?:accDescr\s*\{\s*)/i,/^(?:[\}])/i,/^(?:[^\}]*)/i,/^(?:classDef\s+)/i,/^(?:DEFAULT\s+)/i,/^(?:\w+\s+)/i,/^(?:[^\n]*)/i,/^(?:class\s+)/i,/^(?:(\w+)+((,\s*\w+)*))/i,/^(?:[^\n]*)/i,/^(?:style\s+)/i,/^(?:[\w,]+\s+)/i,/^(?:[^\n]*)/i,/^(?:scale\s+)/i,/^(?:\d+)/i,/^(?:\s+width\b)/i,/^(?:state\s+)/i,/^(?:.*<<fork>>)/i,/^(?:.*<<join>>)/i,/^(?:.*<<choice>>)/i,/^(?:.*\[\[fork\]\])/i,/^(?:.*\[\[join\]\])/i,/^(?:.*\[\[choice\]\])/i,/^(?:.*direction\s+TB[^\n]*)/i,/^(?:.*direction\s+BT[^\n]*)/i,/^(?:.*direction\s+RL[^\n]*)/i,/^(?:.*direction\s+LR[^\n]*)/i,/^(?:["])/i,/^(?:\s*as\s+)/i,/^(?:[^\n\{]*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:\w+\s+\w+.*?\{)/i,/^(?:[^\n\s\{]+)/i,/^(?:\n)/i,/^(?:\{)/i,/^(?:\})/i,/^(?:[\n])/i,/^(?:note\s+)/i,/^(?:left of\b)/i,/^(?:right of\b)/i,/^(?:")/i,/^(?:\s*as\s*)/i,/^(?:["])/i,/^(?:[^"]*)/i,/^(?:[^\n]*)/i,/^(?:\s*[^:\n\s\-]+)/i,/^(?:\s*:[^:\n;]+)/i,/^(?:[\s\S]*?\n\s*end note\b)/i,/^(?:stateDiagram\s+)/i,/^(?:stateDiagram-v2\s+)/i,/^(?:hide empty description\b)/i,/^(?:\[\*\])/i,/^(?:[^:\n\s\-\{]+)/i,/^(?:\s*:(?:[^:\n;]|:[^:\n;])+)/i,/^(?:-->)/i,/^(?:--)/i,/^(?::::)/i,/^(?:$)/i,/^(?:.)/i],conditions:{LINE:{rules:[10,11,12],inclusive:!1},struct:{rules:[10,11,12,23,27,30,36,43,44,45,46,56,57,58,72,73,74,75,76,77],inclusive:!1},FLOATING_NOTE_ID:{rules:[65],inclusive:!1},FLOATING_NOTE:{rules:[62,63,64],inclusive:!1},NOTE_TEXT:{rules:[67,68],inclusive:!1},NOTE_ID:{rules:[66],inclusive:!1},NOTE:{rules:[59,60,61],inclusive:!1},STYLEDEF_STYLEOPTS:{rules:[],inclusive:!1},STYLEDEF_STYLES:{rules:[32],inclusive:!1},STYLE_IDS:{rules:[],inclusive:!1},STYLE:{rules:[31],inclusive:!1},CLASS_STYLE:{rules:[29],inclusive:!1},CLASS:{rules:[28],inclusive:!1},CLASSDEFID:{rules:[26],inclusive:!1},CLASSDEF:{rules:[24,25],inclusive:!1},acc_descr_multiline:{rules:[21,22],inclusive:!1},acc_descr:{rules:[19],inclusive:!1},acc_title:{rules:[17],inclusive:!1},SCALE:{rules:[14,15,34,35],inclusive:!1},ALIAS:{rules:[],inclusive:!1},STATE_ID:{rules:[49],inclusive:!1},STATE_STRING:{rules:[50,51],inclusive:!1},FORK_STATE:{rules:[],inclusive:!1},STATE:{rules:[10,11,12,37,38,39,40,41,42,47,48,52,53,54,55],inclusive:!1},ID:{rules:[10,11,12],inclusive:!1},INITIAL:{rules:[0,1,2,3,4,5,6,7,8,9,11,12,13,16,18,20,23,27,30,33,36,55,58,69,70,71,72,73,74,75,77,78,79],inclusive:!0}}};return F})();ft.lexer=le;function lt(){this.yy={}}return d(lt,"Parser"),lt.prototype=ft,ft.Parser=lt,new lt})();$t.parser=$t;var Ue=$t,H="state",X="root",Ct="relation",ue="classDef",pe="style",ye="applyClass",Z="default",qt="divider",Zt="fill:none",Qt="fill: #333",te="markdown",ee="normal",Et="rect",Dt="rectWithTitle",ge="stateStart",me="stateEnd",Ut="divider",Kt="roundedWithTitle",fe="note",Se="noteGroup",Q="statediagram",be="state",ke=`${Q}-${be}`,se="transition",Te="note",_e="note-edge",Ee=`${se} ${_e}`,De=`${Q}-${Te}`,$e="cluster",Ce=`${Q}-${$e}`,xe="cluster-alt",ve=`${Q}-${xe}`,ie="parent",re="note",Le="state",xt="----",Ie=`${xt}${re}`,Xt=`${xt}${ie}`,ae=d((t,e="TB")=>{if(!t.doc)return e;let n=e;for(let s of t.doc)s.stmt==="dir"&&(n=s.value);return n},"getDir"),Ae=d(function(t,e){return e.db.getClasses()},"getClasses"),we=d(async function(t,e,n,s){b.info("REF0:"),b.info("Drawing state diagram (v2)",e);let{securityLevel:h,state:c,layout:g}=N();s.db.extract(s.db.getRootDocV2());let f=s.db.getData(),l=Wt(e,h);f.type=s.type,f.layoutAlgorithm=g,f.nodeSpacing=c?.nodeSpacing||50,f.rankSpacing=c?.rankSpacing||50,N().look==="neo"?f.markers=["barbNeo"]:f.markers=["barb"],f.diagramId=e,await Gt(f,l);let m=8;try{(typeof s.db.getLinks=="function"?s.db.getLinks():new Map).forEach((E,D)=>{let $=typeof D=="string"?D:typeof D?.id=="string"?D.id:"",O=f.nodes.find(_=>_.id===$);if(!$){b.warn("\u26A0\uFE0F Invalid or missing stateId from key:",JSON.stringify(D));return}let u=l.node()?.querySelectorAll("g.node, g.rough-node"),k;if(u?.forEach(_=>{let R=_.textContent?.trim();(_.id===O?.domId||R===$)&&(k=_)}),!k){b.warn("\u26A0\uFE0F Could not find node matching text:",$);return}let L=k.parentNode;if(!L){b.warn("\u26A0\uFE0F Node has no parent, cannot wrap:",$);return}let I=document.createElementNS("http://www.w3.org/2000/svg","a"),B=E.url.replace(/^"+|"+$/g,"");if(I.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",B),I.setAttribute("target","_blank"),E.tooltip){let _=E.tooltip.replace(/^"+|"+$/g,"");I.setAttribute("title",_),k.setAttribute("title",_)}L.replaceChild(I,k),I.appendChild(k),b.info("\u{1F517} Wrapped node in <a> tag for:",$,E.url)})}catch(E){b.error("\u274C Error injecting clickable links:",E)}jt.insertTitle(l,"statediagramTitleText",c?.titleTopMargin??25,s.db.getDiagramTitle()),Mt(l,m,Q,c?.useMaxWidth??!0)},"draw"),Ke={getClasses:Ae,draw:we,getDir:ae},gt=new Map,z=0;function mt(t="",e=0,n="",s=xt){let h=n!==null&&n.length>0?`${s}${n}`:"";return`${Le}-${t}${h}-${e}`}d(mt,"stateDomId");var Ne=d((t,e,n,s,h,c,g,f)=>{b.trace("items",e),e.forEach(l=>{switch(l.stmt){case H:q(t,l,n,s,h,c,g,f);break;case Z:q(t,l,n,s,h,c,g,f);break;case Ct:{q(t,l.state1,n,s,h,c,g,f),q(t,l.state2,n,s,h,c,g,f);let m=g==="neo",E={id:"edge"+z,start:l.state1.id,end:l.state2.id,arrowhead:"normal",arrowTypeEnd:m?"arrow_barb_neo":"arrow_barb",style:Zt,labelStyle:"",label:G.sanitizeText(l.description??"",N()),arrowheadStyle:Qt,labelpos:"c",labelType:te,thickness:ee,classes:se,look:g};h.push(E),z++}break}})},"setupDoc"),Ht=d((t,e="TB")=>{let n=e;if(t.doc)for(let s of t.doc)s.stmt==="dir"&&(n=s.value);return n},"getDir");function J(t,e,n){if(!e.id||e.id==="</join></fork>"||e.id==="</choice>")return;e.cssClasses&&(Array.isArray(e.cssCompiledStyles)||(e.cssCompiledStyles=[]),e.cssClasses.split(" ").forEach(h=>{let c=n.get(h);c&&(e.cssCompiledStyles=[...e.cssCompiledStyles??[],...c.styles])}));let s=t.find(h=>h.id===e.id);s?Object.assign(s,e):t.push(e)}d(J,"insertOrUpdateNode");function ne(t){return t?.classes?.join(" ")??""}d(ne,"getClassesFromDbInfo");function oe(t){return t?.styles??[]}d(oe,"getStylesFromDbInfo");var q=d((t,e,n,s,h,c,g,f)=>{let l=e.id,m=n.get(l),E=ne(m),D=oe(m),$=N();if(b.info("dataFetcher parsedItem",e,m,D),l!=="root"){let O=Et;e.start===!0?O=ge:e.start===!1&&(O=me),e.type!==Z&&(O=e.type),gt.get(l)||gt.set(l,{id:l,shape:O,description:G.sanitizeText(l,$),cssClasses:`${E} ${ke}`,cssStyles:D});let u=gt.get(l);e.description&&(Array.isArray(u.description)?(u.shape=Dt,u.description.push(e.description)):u.description?.length&&u.description.length>0?(u.shape=Dt,u.description===l?u.description=[e.description]:u.description=[u.description,e.description]):(u.shape=Et,u.description=e.description),u.description=G.sanitizeTextOrArray(u.description,$)),u.description?.length===1&&u.shape===Dt&&(u.type==="group"?u.shape=Kt:u.shape=Et),!u.type&&e.doc&&(b.info("Setting cluster for XCX",l,Ht(e)),u.type="group",u.isGroup=!0,u.dir=Ht(e),u.explicitDir=e.doc.some(L=>L.stmt==="dir"),u.shape=e.type===qt?Ut:Kt,u.cssClasses=`${u.cssClasses} ${Ce} ${c?ve:""}`);let k={labelStyle:"",shape:u.shape,label:u.description,cssClasses:u.cssClasses,cssCompiledStyles:[],cssStyles:u.cssStyles,id:l,dir:u.dir,domId:mt(l,z),type:u.type,isGroup:u.type==="group",padding:8,rx:10,ry:10,look:g,labelType:"markdown"};if(k.shape===Ut&&(k.label=""),t&&t.id!=="root"&&(b.trace("Setting node ",l," to be child of its parent ",t.id),k.parentId=t.id),k.centerLabel=!0,e.note){let L={labelStyle:"",shape:fe,label:e.note.text,labelType:"markdown",cssClasses:De,cssStyles:[],cssCompiledStyles:[],id:l+Ie+"-"+z,domId:mt(l,z,re),type:u.type,isGroup:u.type==="group",padding:$.flowchart?.padding,look:g,position:e.note.position},I=l+Xt,B={labelStyle:"",shape:Se,label:e.note.text,cssClasses:u.cssClasses,cssStyles:[],id:l+Xt,domId:mt(l,z,ie),type:"group",isGroup:!0,padding:16,look:g,position:e.note.position};z++,B.id=I,L.parentId=I,J(s,B,f),J(s,L,f),J(s,k,f);let _=l,R=L.id;e.note.position==="left of"&&(_=L.id,R=l),h.push({id:_+"-"+R,start:_,end:R,arrowhead:"none",arrowTypeEnd:"",style:Zt,labelStyle:"",classes:Ee,arrowheadStyle:Qt,labelpos:"c",labelType:te,thickness:ee,look:g})}else J(s,k,f)}e.doc&&(b.trace("Adding nodes children "),Ne(e,e.doc,n,s,h,!c,g,f))},"dataFetcher"),Oe=d(()=>{gt.clear(),z=0},"reset"),v={START_NODE:"[*]",START_TYPE:"start",END_NODE:"[*]",END_TYPE:"end",COLOR_KEYWORD:"color",FILL_KEYWORD:"fill",BG_FILL:"bgFill",STYLECLASS_SEP:","},Vt=d(()=>new Map,"newClassesList"),Jt=d(()=>({relations:[],states:new Map,documents:{}}),"newDoc"),yt=d(t=>JSON.parse(JSON.stringify(t)),"clone"),Xe=class{constructor(t){this.version=t,this.nodes=[],this.edges=[],this.rootDoc=[],this.classes=Vt(),this.documents={root:Jt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.dividerCnt=0,this.links=new Map,this.funs=[],this.getAccTitle=Ot,this.setAccTitle=Nt,this.getAccDescription=Ft,this.setAccDescription=Rt,this.setDiagramTitle=Bt,this.getDiagramTitle=Pt,this.clear(),this.setRootDoc=this.setRootDoc.bind(this),this.getDividerId=this.getDividerId.bind(this),this.setDirection=this.setDirection.bind(this),this.trimColon=this.trimColon.bind(this),this.bindFunctions=this.bindFunctions.bind(this)}static{d(this,"StateDB")}static{this.relationType={AGGREGATION:0,EXTENSION:1,COMPOSITION:2,DEPENDENCY:3}}extract(t){this.clear(!0);for(let s of Array.isArray(t)?t:t.doc)switch(s.stmt){case H:this.addState(s.id.trim(),s.type,s.doc,s.description,s.note);break;case Ct:this.addRelation(s.state1,s.state2,s.description);break;case ue:this.addStyleClass(s.id.trim(),s.classes);break;case pe:this.handleStyleDef(s);break;case ye:this.setCssClass(s.id.trim(),s.styleClass);break;case"click":this.addLink(s.id,s.url,s.tooltip);break}let e=this.getStates(),n=N();Oe(),q(void 0,this.getRootDocV2(),e,this.nodes,this.edges,!0,n.look,this.classes);for(let s of this.nodes)if(Array.isArray(s.label)){if(s.description=s.label.slice(1),s.isGroup&&s.description.length>0)throw new Error(`Group nodes can only have label. Remove the additional description for node [${s.id}]`);s.label=s.label[0]}}handleStyleDef(t){let e=t.id.trim().split(","),n=t.styleClass.split(",");for(let s of e){let h=this.getState(s);if(!h){let c=s.trim();this.addState(c),h=this.getState(c)}h&&(h.styles=n.map(c=>c.replace(/;/g,"")?.trim()))}}setRootDoc(t){b.info("Setting root doc",t),this.rootDoc=t,this.version===1?this.extract(t):this.extract(this.getRootDocV2())}docTranslator(t,e,n){if(e.stmt===Ct){this.docTranslator(t,e.state1,!0),this.docTranslator(t,e.state2,!1);return}if(e.stmt===H&&(e.id===v.START_NODE?(e.id=t.id+(n?"_start":"_end"),e.start=n):e.id=e.id.trim()),e.stmt!==X&&e.stmt!==H||!e.doc)return;let s=[],h=[];for(let c of e.doc)if(c.type===qt){let g=yt(c);g.doc=yt(h),s.push(g),h=[]}else h.push(c);if(s.length>0&&h.length>0){let c={stmt:H,id:Yt(),type:"divider",doc:yt(h)};s.push(yt(c)),e.doc=s}e.doc.forEach(c=>this.docTranslator(e,c,!0))}getRootDocV2(){return this.docTranslator({id:X,stmt:X},{id:X,stmt:X,doc:this.rootDoc},!0),{id:X,doc:this.rootDoc}}addState(t,e=Z,n=void 0,s=void 0,h=void 0,c=void 0,g=void 0,f=void 0){let l=t?.trim();if(!this.currentDocument.states.has(l))b.info("Adding state ",l,s),this.currentDocument.states.set(l,{stmt:H,id:l,descriptions:[],type:e,doc:n,note:h,classes:[],styles:[],textStyles:[]});else{let m=this.currentDocument.states.get(l);if(!m)throw new Error(`State not found: ${l}`);m.doc||(m.doc=n),m.type||(m.type=e)}if(s&&(b.info("Setting state description",l,s),(Array.isArray(s)?s:[s]).forEach(m=>this.addDescription(l,m.trim()))),h){let m=this.currentDocument.states.get(l);if(!m)throw new Error(`State not found: ${l}`);m.note=h,m.note.text=G.sanitizeText(m.note.text,N())}c&&(b.info("Setting state classes",l,c),(Array.isArray(c)?c:[c]).forEach(m=>this.setCssClass(l,m.trim()))),g&&(b.info("Setting state styles",l,g),(Array.isArray(g)?g:[g]).forEach(m=>this.setStyle(l,m.trim()))),f&&(b.info("Setting state styles",l,g),(Array.isArray(f)?f:[f]).forEach(m=>this.setTextStyle(l,m.trim())))}clear(t){this.nodes=[],this.edges=[],this.funs=[this.setupToolTips.bind(this)],this.documents={root:Jt()},this.currentDocument=this.documents.root,this.startEndCount=0,this.classes=Vt(),t||(this.links=new Map,wt())}getState(t){return this.currentDocument.states.get(t)}getStates(){return this.currentDocument.states}logDocuments(){b.info("Documents = ",this.documents)}getRelations(){return this.currentDocument.relations}addLink(t,e,n){this.links.set(t,{url:e,tooltip:n}),b.warn("Adding link",t,e,n)}getLinks(){return this.links}startIdIfNeeded(t=""){return t===v.START_NODE?(this.startEndCount++,`${v.START_TYPE}${this.startEndCount}`):t}startTypeIfNeeded(t="",e=Z){return t===v.START_NODE?v.START_TYPE:e}endIdIfNeeded(t=""){return t===v.END_NODE?(this.startEndCount++,`${v.END_TYPE}${this.startEndCount}`):t}endTypeIfNeeded(t="",e=Z){return t===v.END_NODE?v.END_TYPE:e}addRelationObjs(t,e,n=""){let s=this.startIdIfNeeded(t.id.trim()),h=this.startTypeIfNeeded(t.id.trim(),t.type),c=this.startIdIfNeeded(e.id.trim()),g=this.startTypeIfNeeded(e.id.trim(),e.type);this.addState(s,h,t.doc,t.description,t.note,t.classes,t.styles,t.textStyles),this.addState(c,g,e.doc,e.description,e.note,e.classes,e.styles,e.textStyles),this.currentDocument.relations.push({id1:s,id2:c,relationTitle:G.sanitizeText(n,N())})}addRelation(t,e,n){if(typeof t=="object"&&typeof e=="object")this.addRelationObjs(t,e,n);else if(typeof t=="string"&&typeof e=="string"){let s=this.startIdIfNeeded(t.trim()),h=this.startTypeIfNeeded(t),c=this.endIdIfNeeded(e.trim()),g=this.endTypeIfNeeded(e);this.addState(s,h),this.addState(c,g),this.currentDocument.relations.push({id1:s,id2:c,relationTitle:n?G.sanitizeText(n,N()):void 0})}}addDescription(t,e){let n=this.currentDocument.states.get(t),s=e.startsWith(":")?e.replace(":","").trim():e;n?.descriptions?.push(G.sanitizeText(s,N()))}cleanupLabel(t){return t.startsWith(":")?t.slice(2).trim():t.trim()}getDividerId(){return this.dividerCnt++,`divider-id-${this.dividerCnt}`}addStyleClass(t,e=""){this.classes.has(t)||this.classes.set(t,{id:t,styles:[],textStyles:[]});let n=this.classes.get(t);e&&n&&e.split(v.STYLECLASS_SEP).forEach(s=>{let h=s.replace(/([^;]*);/,"$1").trim();if(RegExp(v.COLOR_KEYWORD).exec(s)){let c=h.replace(v.FILL_KEYWORD,v.BG_FILL).replace(v.COLOR_KEYWORD,v.FILL_KEYWORD);n.textStyles.push(c)}n.styles.push(h)})}getClasses(){return this.classes}setupToolTips(t){let e=zt();pt(t).select("svg").selectAll("g.node, g.rough-node").on("mouseover",n=>{let s=pt(n.currentTarget),h=s.attr("title");if(h===null)return;let c=n.currentTarget?.getBoundingClientRect();e.transition().duration(200).style("opacity",".9"),e.style("left",window.scrollX+c.left+(c.right-c.left)/2+"px").style("top",window.scrollY+c.bottom+"px"),e.html(At.sanitize(h)),s.classed("hover",!0)}).on("mouseout",n=>{e.transition().duration(500).style("opacity",0),pt(n.currentTarget).classed("hover",!1)})}setCssClass(t,e){t.split(",").forEach(n=>{let s=this.getState(n);if(!s){let h=n.trim();this.addState(h),s=this.getState(h)}s?.classes?.push(e)})}setStyle(t,e){this.getState(t)?.styles?.push(e)}setTextStyle(t,e){this.getState(t)?.textStyles?.push(e)}bindFunctions(t){this.funs.forEach(e=>{e(t)})}getDirectionStatement(){return this.rootDoc.find(t=>t.stmt==="dir")}getDirection(){return this.getDirectionStatement()?.value??"TB"}setDirection(t){let e=this.getDirectionStatement();e?e.value=t:this.rootDoc.unshift({stmt:"dir",value:t})}trimColon(t){return t.startsWith(":")?t.slice(1).trim():t.trim()}getData(){let t=N();return{nodes:this.nodes,edges:this.edges,other:{},config:t,direction:ae(this.getRootDocV2())}}getConfig(){return N().state}},Re=d(t=>`
defs [id$="-barbEnd"] {
    fill: ${t.transitionColor};
    stroke: ${t.transitionColor};
  }
g.stateGroup text {
  fill: ${t.nodeBorder};
  stroke: none;
  font-size: 10px;
}
g.stateGroup text {
  fill: ${t.textColor};
  stroke: none;
  font-size: 10px;

}
g.stateGroup .state-title {
  font-weight: bolder;
  fill: ${t.stateLabelColor};
}

g.stateGroup rect {
  fill: ${t.mainBkg};
  stroke: ${t.nodeBorder};
}

g.stateGroup line {
  stroke: ${t.lineColor};
  stroke-width: ${t.strokeWidth||1};
}

.transition {
  stroke: ${t.transitionColor};
  stroke-width: ${t.strokeWidth||1};
  fill: none;
}

.stateGroup .composit {
  fill: ${t.background};
  border-bottom: 1px
}

.stateGroup .alt-composit {
  fill: #e0e0e0;
  border-bottom: 1px
}

.state-note {
  stroke: ${t.noteBorderColor};
  fill: ${t.noteBkgColor};

  text {
    fill: ${t.noteTextColor};
    stroke: none;
    font-size: 10px;
  }
}

.stateLabel .box {
  stroke: none;
  stroke-width: 0;
  fill: ${t.mainBkg};
  opacity: 0.5;
}

.edgeLabel .label rect {
  fill: ${t.labelBackgroundColor};
  opacity: 0.5;
}
.edgeLabel {
  background-color: ${t.edgeLabelBackground};
  p {
    background-color: ${t.edgeLabelBackground};
  }
  rect {
    opacity: 0.5;
    background-color: ${t.edgeLabelBackground};
    fill: ${t.edgeLabelBackground};
  }
  text-align: center;
}
.edgeLabel .label text {
  fill: ${t.transitionLabelColor||t.tertiaryTextColor};
}
.label div .edgeLabel {
  color: ${t.transitionLabelColor||t.tertiaryTextColor};
}

.stateLabel text {
  fill: ${t.stateLabelColor};
  font-size: 10px;
  font-weight: bold;
}

.node circle.state-start {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node .fork-join {
  fill: ${t.specialStateColor};
  stroke: ${t.specialStateColor};
}

.node circle.state-end {
  fill: ${t.innerEndBackground};
  stroke: ${t.background};
  stroke-width: 1.5
}
.end-state-inner {
  fill: ${t.compositeBackground||t.background};
  // stroke: ${t.background};
  stroke-width: 1.5
}

.node rect {
  fill: ${t.stateBkg||t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth||1}px;
}
.node polygon {
  fill: ${t.mainBkg};
  stroke: ${t.stateBorder||t.nodeBorder};;
  stroke-width: ${t.strokeWidth||1}px;
}
[id$="-barbEnd"] {
  fill: ${t.lineColor};
}

.statediagram-cluster rect {
  fill: ${t.compositeTitleBackground};
  stroke: ${t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth||1}px;
}

.cluster-label, .nodeLabel {
  color: ${t.stateLabelColor};
  // line-height: 1;
}

.statediagram-cluster rect.outer {
  rx: 5px;
  ry: 5px;
}
.statediagram-state .divider {
  stroke: ${t.stateBorder||t.nodeBorder};
}

.statediagram-state .title-state {
  rx: 5px;
  ry: 5px;
}
.statediagram-cluster.statediagram-cluster .inner {
  fill: ${t.compositeBackground||t.background};
}
.statediagram-cluster.statediagram-cluster-alt .inner {
  fill: ${t.altBackground?t.altBackground:"#efefef"};
}

.statediagram-cluster .inner {
  rx:0;
  ry:0;
}

.statediagram-state rect.basic {
  rx: 5px;
  ry: 5px;
}
.statediagram-state rect.divider {
  stroke-dasharray: 10,10;
  fill: ${t.altBackground?t.altBackground:"#efefef"};
}

.note-edge {
  stroke-dasharray: 5;
}

.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}
.statediagram-note rect {
  fill: ${t.noteBkgColor};
  stroke: ${t.noteBorderColor};
  stroke-width: 1px;
  rx: 0;
  ry: 0;
}

.statediagram-note text {
  fill: ${t.noteTextColor};
}

.statediagram-note .nodeLabel {
  color: ${t.noteTextColor};
}
.statediagram .edgeLabel {
  color: red; // ${t.noteTextColor};
}

[id$="-dependencyStart"], [id$="-dependencyEnd"] {
  fill: ${t.lineColor};
  stroke: ${t.lineColor};
  stroke-width: ${t.strokeWidth||1};
}

.statediagramTitleText {
  text-anchor: middle;
  font-size: 18px;
  fill: ${t.textColor};
}

[data-look="neo"].statediagram-cluster rect {
  fill: ${t.mainBkg};
  stroke: ${t.useGradient?"url("+t.svgId+"-gradient)":t.stateBorder||t.nodeBorder};
  stroke-width: ${t.strokeWidth??1};
}
[data-look="neo"].statediagram-cluster rect.outer {
  rx: ${t.radius}px;
  ry: ${t.radius}px;
  filter: ${t.dropShadow?t.dropShadow.replace("url(#drop-shadow)",`url(${t.svgId}-drop-shadow)`):"none"}
}
`,"getStyles"),He=Re;export{Ue as a,Ke as b,Xe as c,He as d};
