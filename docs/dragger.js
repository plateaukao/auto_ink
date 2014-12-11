/*\
 * Dragger
 [ class ]
 - div (DOM node) target div
 - TP (array of points) modify these points
 - redraw (function) call when redraw is needed
 - trans (function) convert between object and screen space
\*/
function Dragger(div,TP,redraw,trans)
{
	var This = this;
	This.drag=-1;
	This.sel_box=3;
	
	function onMouseDown(e)
	{
		var T=This;
		e=e||window.event;
		T.xmouse=e.clientX-T.canx+document.body.scrollLeft;
		T.ymouse=e.clientY-T.cany+document.body.scrollTop;
		T.lastxmouse=T.xmouse;
		T.lastymouse=T.ymouse;
		//
		for ( var i=0; i<TP.length; i++)
		{
			var P;
			if( trans) P = trans(TP[i],true);
			else P = TP[i];
			if (Math.abs(T.xmouse - P.x) < T.sel_box && Math.abs(T.ymouse - P.y) < T.sel_box)
			{
				T.drag = i;
				return 1;
			}
		}
		T.drag = -1;
	}
	function onMouseUp(e)
	{
		var T=This;
		T.drag=-1;
	}
	function onMouseMove(e)
	{
		var T=This;
		e=e||window.event;
		T.xmouse=e.clientX-T.canx+document.body.scrollLeft;
		T.ymouse=e.clientY-T.cany+document.body.scrollTop;
		if ( T.drag!=-1)
		{
			var i = T.drag;
			var P;
			if( trans) P = trans({x:T.xmouse,y:T.ymouse},false);
			else P = {x:T.xmouse,y:T.ymouse};
			TP[i].x = P.x;
			TP[i].y = P.y;
			redraw();
		}
		T.lastxmouse=T.xmouse;
		T.lastymouse=T.ymouse;
	}
	
	function getPositionLeft(This){
		var el=This;var pL=0;
		while(el){pL+=el.offsetLeft;el=el.offsetParent;}
		return pL;
	}
	function getPositionTop(This){
		var el=This;var pT=0;
		while(el){pT+=el.offsetTop;el=el.offsetParent;}
		return pT;
	}
	this.canx=getPositionLeft(div);
	this.cany=getPositionTop(div);
	
	div.onmousedown	=onMouseDown;
	div.onmouseup	=onMouseUp;
	div.onmousemove	=onMouseMove;
	
	redraw();
}
