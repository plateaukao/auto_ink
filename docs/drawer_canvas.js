function Drawer(div,width,height)
{
	var T=this;
	T.lineslots=[[],[],[],[],[]];
	T.linecolor=['#000','#F00','#090','#00B','#AAA'];
	T.rl = {};
	T.ctx = div.getContext('2d');
	T.stroke_width = 1;
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
	div.setAttribute('width',div.offsetWidth);
	div.setAttribute('height',div.offsetHeight);
}
Drawer.tagname = 'canvas';
Drawer.prototype.moveTo=function(P,C)
{
	if ( C==null) {C=4;}
	this.lineslots[C].push({c:'M',x:P.x,y:P.y});
	this.PP={x:P.x,y:P.y};
}
Drawer.prototype.lineTo=function(P,C)
{
	if ( C==null) {C=4;}
	this.lineslots[C].push({c:'L',x:P.x,y:P.y});
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
	var ctx=T.ctx;
	var el;
	for ( var i=4; i>=0; i--)
	{
		ctx.beginPath();
		for( var j=0; j<T.lineslots[i].length; j++)
		{
			var P = T.lineslots[i][j];
			switch (P.c)
			{
				case 'M': ctx.moveTo(P.x,P.y); break;
				case 'L': ctx.lineTo(P.x,P.y); break;
			}
		}
		if( !solid)
		{
			ctx.strokeStyle = T.linecolor[i];
			ctx.lineWidth = T.stroke_width;
			ctx.stroke();
		}
		else
		{
			ctx.fillStyle = T.linecolor[i];
			ctx.fill();
		}
	}
	T.lineslots=[[],[],[],[],[]];
	return;
}
Drawer.prototype.text=function(x,y,text)
{
	var ctx = this.ctx;
	ctx.font = this.font_size+' Arial';
	ctx.fillStyle = '#000';
	x -= text.length*parseInt(this.font_size)*0.2;
	y += parseInt(this.font_size)*0.4;
	ctx.fillText(text,x,y);
}
Drawer.prototype.rect=function(x,y,w,h,C)
{
	var ctx = this.ctx;
	C=C||0;
	ctx.strokeStyle = this.linecolor[C];
	ctx.lineWidth = 1;
	ctx.strokeRect(x,y,w,h);
}
Drawer.prototype.clear=function()
{
	var T=this;
	T.ctx.clearRect(0,0,T.width,T.height);
}