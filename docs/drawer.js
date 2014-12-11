function Drawer(div,width,height)
{
	var T=this;
	T.linestring=['','','','',''];
	T.linecolor=['#000','#F00','#090','#00B','#AAA'];
	T.rl = new Raphael(div);
	T.stroke_width = 0.4;
	T.font_size = '6px';
	if( width && height)
	{
		T.width = width;
		T.height = height;
	}
	else
	{
		T.width = div.offsetWidth;
		T.height = div.offsetHeight;
	}
}
Drawer.tagname = 'div';
Drawer.prototype.moveTo=function(P,C)
{
	if ( C==null) {C=4;}
	this.linestring[C] += ' M '+P.x+','+P.y;
	this.PP={x:P.x,y:P.y};
}
Drawer.prototype.lineTo=function(P,C)
{
	if ( C==null) {C=4;}
	this.linestring[C] += ' L '+P.x+','+P.y;
	this.PP={x:P.x,y:P.y};
}
Drawer.prototype.arrowTo=function(P,C)
{
	if( !this.PP)
		return;
	var A={x:this.PP.x,y:this.PP.y},
		B=P;
	var R=0.85; var K=0.1;
	var vx=A.y-B.y;
	var vy=B.x-A.x;
	var acx=vy*R+A.x;
	var acy=-vx*R+A.y;
	this.lineTo(B,C);
	this.moveTo({x:acx+vx*K,y:acy+vy*K}, C)
	this.lineTo(B,C);
	this.lineTo({x:acx-vx*K,y:acy-vy*K}, C);
	this.moveTo(B,C);
}
Drawer.prototype.quadraticCurveTo=function(P1,P2,C)
{
	if ( C==null) {C=4;}
	this.linestring[C] += ' Q '+P1.x+','+P1.y+' '+P2.x+','+P2.y;
}
Drawer.prototype.point=function(P,s,C)
{
	var T=this;
	if (!s) {s=2;}
	if (C==null) {C=0;}
	T.moveTo({x:P.x-s, y:P.y-s},C);
	T.lineTo({x:P.x+s, y:P.y+s},C);
	T.moveTo({x:P.x-s, y:P.y+s},C);
	T.lineTo({x:P.x+s, y:P.y-s},C);
	T.moveTo({x:P.x,   y:P.y}  ,C);
}
Drawer.prototype.draw=function(solid)
{
	var T=this;
	var el;
	for ( var i=4; i>=0; i--)
		if( T.linestring[i]!=='')
		{
			el = T.rl.path( T.linestring[i]);
			if( !solid)
				el.attr( {stroke:T.linecolor[i], 'stroke-width':T.stroke_width});
			else
				el.attr( {stroke:'none', fill:T.linecolor[i]});
		}
	T.linestring=['','','','',''];
	return el;
}
Drawer.prototype.text=function(x,y,text)
{
	var T=this;
	T.rl.text(x,y,text).attr({'font-size':T.font_size});
}
Drawer.prototype.rect=function(x,y,w,h,C)
{
	var T=this;
	C=C||0;
	T.rl.rect(x,y,w,h).attr({'stroke':T.linecolor[C]});
}
Drawer.prototype.clear=function()
{
	var T=this;
	T.rl.clear();
}