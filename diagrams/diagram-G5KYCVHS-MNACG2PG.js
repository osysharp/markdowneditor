import{a as F}from"./chunk-ZWDL2XHY.js";import{a as T}from"./chunk-LDYIF3DJ.js";import"./chunk-5JBYUV7H.js";import"./chunk-36YE74CQ.js";import"./chunk-BDUGOG6J.js";import"./chunk-Y4T4PE73.js";import"./chunk-D5R77TGS.js";import"./chunk-ZW4CN3XJ.js";import"./chunk-2CPIDWVS.js";import"./chunk-ST2ZCEXA.js";import"./chunk-AN2YYZIE.js";import"./chunk-B43CR53C.js";import"./chunk-FXQNBAFU.js";import"./chunk-XRK77DCC.js";import"./chunk-4QOQ3AVK.js";import"./chunk-BRQLOFUA.js";import"./chunk-3J256FOG.js";import"./chunk-P45CWOGJ.js";import{a as W}from"./chunk-WHRFAXXM.js";import{o as u}from"./chunk-CDE7BSEC.js";import"./chunk-KYV6NIEV.js";import{O as x,T as $,U as B,V as v,W as C,X as P,Y as S,Z as z,j as w,t as y}from"./chunk-FUV4E2MS.js";import{b as g}from"./chunk-XTASYECX.js";import{a as h}from"./chunk-2VB4RCU6.js";var Y=w.packet,E=class{constructor(){this.packet=[],this.setAccTitle=B,this.getAccTitle=v,this.setDiagramTitle=S,this.getDiagramTitle=z,this.getAccDescription=P,this.setAccDescription=C}static{h(this,"PacketDB")}getConfig(){let t=u({...Y,...y().packet});return t.showBits&&(t.paddingY+=10),t}getPacket(){return this.packet}pushWord(t){t.length>0&&this.packet.push(t)}clear(){$(),this.packet=[]}},j=1e4,L=h((t,e)=>{F(t,e);let a=-1,i=[],l=1,{bitsPerRow:n}=e.getConfig();for(let{start:r,end:s,bits:p,label:d}of t.blocks){if(r!==void 0&&s!==void 0&&s<r)throw new Error(`Packet block ${r} - ${s} is invalid. End must be greater than start.`);if(r??=a+1,r!==a+1)throw new Error(`Packet block ${r} - ${s??r} is not contiguous. It should start from ${a+1}.`);if(p===0)throw new Error(`Packet block ${r} is invalid. Cannot have a zero bit field.`);for(s??=r+(p??1)-1,p??=s-r+1,a=s,g.debug(`Packet block ${r} - ${a} with label ${d}`);i.length<=n+1&&e.getPacket().length<j;){let[c,o]=M({start:r,end:s,bits:p,label:d},l,n);if(i.push(c),c.end+1===l*n&&(e.pushWord(i),i=[],l++),!o)break;({start:r,end:s,bits:p,label:d}=o)}}e.pushWord(i)},"populate"),M=h((t,e,a)=>{if(t.start===void 0)throw new Error("start should have been set during first phase");if(t.end===void 0)throw new Error("end should have been set during first phase");if(t.start>t.end)throw new Error(`Block start ${t.start} is greater than block end ${t.end}.`);if(t.end+1<=e*a)return[t,void 0];let i=e*a-1,l=e*a;return[{start:t.start,end:i,label:t.label,bits:i-t.start},{start:l,end:t.end,label:t.label,bits:t.end-l}]},"getNextFittingBlock"),D={parser:{yy:void 0},parse:h(async t=>{let e=await T("packet",t),a=D.parser?.yy;if(!(a instanceof E))throw new Error("parser.parser?.yy was not a PacketDB. This is due to a bug within Mermaid, please report this issue at https://github.com/mermaid-js/mermaid/issues.");g.debug(e),L(e,a)},"parse")},H=h((t,e,a,i)=>{let l=i.db,n=l.getConfig(),{rowHeight:r,paddingY:s,bitWidth:p,bitsPerRow:d}=n,c=l.getPacket(),o=l.getDiagramTitle(),k=r+s,b=k*(c.length+1)-(o?0:r),m=p*d+2,f=W(e);f.attr("viewBox",`0 0 ${m} ${b}`),x(f,b,m,n.useMaxWidth);for(let[A,R]of c.entries())N(f,R,A,n);f.append("text").text(o).attr("x",m/2).attr("y",b-k/2).attr("dominant-baseline","middle").attr("text-anchor","middle").attr("class","packetTitle")},"draw"),N=h((t,e,a,{rowHeight:i,paddingX:l,paddingY:n,bitWidth:r,bitsPerRow:s,showBits:p})=>{let d=t.append("g"),c=a*(i+n)+n;for(let o of e){let k=o.start%s*r+1,b=(o.end-o.start+1)*r-l;if(d.append("rect").attr("x",k).attr("y",c).attr("width",b).attr("height",i).attr("class","packetBlock"),d.append("text").attr("x",k+b/2).attr("y",c+i/2).attr("class","packetLabel").attr("dominant-baseline","middle").attr("text-anchor","middle").text(o.label),!p)continue;let m=o.end===o.start,f=c-2;d.append("text").attr("x",k+(m?b/2:0)).attr("y",f).attr("class","packetByte start").attr("dominant-baseline","auto").attr("text-anchor",m?"middle":"start").text(o.start),m||d.append("text").attr("x",k+b).attr("y",f).attr("class","packetByte end").attr("dominant-baseline","auto").attr("text-anchor","end").text(o.end)}},"drawWord"),O={draw:H},V={byteFontSize:"10px",startByteColor:"black",endByteColor:"black",labelColor:"black",labelFontSize:"12px",titleColor:"black",titleFontSize:"14px",blockStrokeColor:"black",blockStrokeWidth:"1",blockFillColor:"#efefef"},X=h(({packet:t}={})=>{let e=u(V,t);return`
	.packetByte {
		font-size: ${e.byteFontSize};
	}
	.packetByte.start {
		fill: ${e.startByteColor};
	}
	.packetByte.end {
		fill: ${e.endByteColor};
	}
	.packetLabel {
		fill: ${e.labelColor};
		font-size: ${e.labelFontSize};
	}
	.packetTitle {
		fill: ${e.titleColor};
		font-size: ${e.titleFontSize};
	}
	.packetBlock {
		stroke: ${e.blockStrokeColor};
		stroke-width: ${e.blockStrokeWidth};
		fill: ${e.blockFillColor};
	}
	`},"styles"),mt={parser:D,get db(){return new E},renderer:O,styles:X};export{mt as diagram};
