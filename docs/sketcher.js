function create_toolbar(toolbar)
{
	var mode = document.createElement('input');
	mode.id = 'mode';
	mode.style.width = '40px';
	toolbar.appendChild(mode);
	
	var commands = [{name:'undo',key:'ctrl+z'},{name:'redo',key:'ctrl+y'},{name:'delete',key:'delete'}];
	for( var i in commands)
		(function(i){
			var button = document.createElement('button');
			button.innerHTML = commands[i].name;
			button.onclick = action;
			shortcut.add(commands[i].key,action);
			function action()
			{
				if( tooltarget && tooltarget[commands[i].name])
					tooltarget[commands[i].name]();
			}
			toolbar.appendChild(button);
		}(i));
	
	var modes = ['pen','line','refine','points','select curves','select points'];
	for( var i=0; i<modes.length; i++)
		(function(i){
			var button = document.createElement('button');
			button.innerHTML = modes[i]+'('+(i+1)+')';
			button.onclick = action;
			shortcut.add((i+1)+'',action);
			function action()
			{
				if( tooltarget && tooltarget.idle())
				{
					tooltarget.switch_tool();
					mode.value=modes[i];
				}
			}
			toolbar.appendChild(button);
		}(i));
	mode.value=modes[0];
}

function sketcher(callback)
{
	var div = this.div = document.createElement(Drawer.tagname);
	div.className = 'viewerbox';
	current_group.appendChild(div);
	var width = div.offsetWidth;
	var height = div.offsetHeight;
	var drawarea = {left:width/8,top:height/8,right:width*7/8,bottom:height*7/8};
	var drawer = new Drawer(div);
	drawer.stroke_width = 1;
	if( !tooltarget) tooltarget=this;
	
	var buffer=[];
	var curves=this.curves=[];
	var history = [],
		history_i = 0;
	var This = this,
		xmouse,
		ymouse,
		lastxmouse,
		lastymouse,
		selected=-1,
		select_rect,
		pendown = false,
		counter = 0,
		canx = getPositionLeft(div),
		cany = getPositionTop(div);
	
	redraw();
	
	div.onmousedown	=onMouseDown;
	div.onmouseup	=onMouseUp;
	div.onmousemove	=onMouseMove;
	div.oncontextmenu = function (e) {
		e.preventDefault();
		return false;
	};
	
	function update()
	{
		var paths=prepare_curves(curves);
		callback(paths);
	}
	function edit_mode()
	{
		return $('mode').value;
	}
	function curves_push(C)
	{
		touch_history(
			function(){ curves.pop() },
			function(){ curves.push(C) }
		);
	}
	function curves_replace(i,C)
	{
		var O = curves[i];
		touch_history(
			function(){ curves[i]=O },
			function(){ curves[i]=C }
		);
	}
	function touch_history(undo,redo)
	{
		if( history_i!==0)
		{
			history = history.slice(history_i);
			history_i = 0;
		}
		history.unshift({
			undo:undo,
			redo:redo
		});
		var limit = 30;
		if( history_i<limit && history.length>limit)
		{
			history = history.slice(0,limit+5);
		}
		redo();
		redraw();
		update();
	}
	This.update=function()
	{
		if( this.idle())
			update();
	}
	This.undo=function()
	{
		if( this.idle())
		{
			if( history_i < history.length)
			{
				var H = history[history_i];
				H.undo();
				history_i++;
				redraw();
				update();
			}
		}
	}
	This.redo=function()
	{
		if( this.idle())
		{
			if( history_i > 0)
			{
				history_i--;
				var H = history[history_i];
				H.redo();
				redraw();
				update();
			}
		}
	}
	This.delete=function()
	{
		if( edit_mode()==='select points' && selected instanceof Array)
		{
			var O = curves.slice(0); //shallow copy
			var N = curves.slice(0);
			var affected = [];
			for( var i=0; i<selected.length; i++)
			{
				var S = selected[i];
				if( !affected[S[0]])
				{
					affected[S[0]] = true;
					N[S[0]] = N[S[0]].slice(0);
				}
				N[S[0]][S[1]] = undefined;
			}
			for( var i in affected)
				compact_array(N[i]);
		}
		if( edit_mode()==='select curves' && selected instanceof Array)
		{
			var O = curves.slice(0); //shallow copy
			var N = curves.slice(0);
			for( var i=0; i<selected.length; i++)
				N[selected[i]] = undefined;
			compact_array(N);
		}
		if( O && N)
		{
			selected = undefined;
			touch_history(
				function(){curves = O},
				function(){curves = N}
			);
		}
	}
	
	This.idle=function()
	{
		return !pendown;
	}
	This.switch_tool=function()
	{
		selected = -1;
		redraw();
	}
	This.clear=function()
	{
		curves.length = 0;
		history.length = 0;
		history_i = 0;
	}
	
	function redraw()
	{
		drawer.clear();
		for( var i=0; i<curves.length; i++)
		{
			var color = 0;
			if( i===selected)
				color = 1;
			if( edit_mode()==='select curves' && selected instanceof Array)
			{
				if( selected.indexOf(i)!==-1)
					color = 1;
			}
			draw_curve(curves[i],color);
		}
		draw_curve(buffer);
		if( edit_mode()==='select points' && selected instanceof Array)
		{
			for( var i=0; i<selected.length; i++)
			{
				var S = selected[i];
				drawer.point(curves[S[0]][S[1]],2,1);
			}
		}
		if( edit_mode()==='points' && selected instanceof Array)
		{
			var S = selected;
			drawer.point(curves[S[0]][S[1]],2,1);
		}
		if( select_rect)
			draw_rect(select_rect);
		draw_rect(drawarea);
		//drawer.rl.rect(25,25,150,150).attr({'stroke':'#CCC'});
		drawer.draw();
	}
	function draw_rect(R)
	{
		drawer.moveTo({x:R.left,y:R.top},4);
		drawer.lineTo({x:R.right,y:R.top},4);
		drawer.lineTo({x:R.right,y:R.bottom},4);
		drawer.lineTo({x:R.left,y:R.bottom},4);
		drawer.lineTo({x:R.left,y:R.top},4);
	}
	function draw_curve(curve,color)
	{
		color = color || 0;
		for( var j=0; j<curve.length; j++)
		{
			if( edit_mode()==='select points' || edit_mode()==='points')
				drawer.point(curve[j],2,4);
			var xxTo = j===0?'moveTo':'lineTo';
			drawer[xxTo](curve[j],color);
		}
	}
	
	function onMouseDown(e)
	{
		e=e?e:event;
		xmouse=e.clientX-canx+$('mainarea').scrollLeft;
		ymouse=e.clientY-cany+$('mainarea').scrollTop;
		var mouse = {x:xmouse,y:ymouse};
		if(!xmouse||!ymouse) return;
		if( edit_mode()==='pen' || edit_mode()==='refine')
		{
			if( !pendown && point_in_rect(mouse,drawarea))
			{
				buffer.push(mouse);
				pendown = true;
			}
		}
		else if( edit_mode()==='line')
		{
			if( e.button==0)
			{
				buffer.push(mouse);
				buffer.push(mouse);
				pendown = true;
			}
			else if( e.button==2)
			{
				buffer.pop();
				if( buffer.length >= 2)
				{
					var points = poly_super_sample(buffer,7);
					buffer = [];
					curves_push(points);
				}
				buffer = [];
				pendown = false;
			}
		}
		else if( edit_mode()==='select points' ||
				 edit_mode()==='select curves')
		{
			if( !pendown)
			{
				select_rect = {
					left:xmouse,
					top:ymouse,
					right:xmouse,
					bottom:ymouse
				}
				pendown = true;
			}
		}
		else if( edit_mode()==='points')
		{
			if( !pendown)
			{
				pendown = true;
				var S = selected;
				S.original = curves[S[0]][S[1]];
			}
		}
		tooltarget = This;
		lastxmouse=xmouse;
		lastymouse=ymouse;
	}
	function onMouseMove(e)
	{
		e=e?e:event;
		xmouse=e.clientX-canx+$('mainarea').scrollLeft;
		ymouse=e.clientY-cany+$('mainarea').scrollTop;
		var mouse = {x:xmouse,y:ymouse};
		if(!xmouse||!ymouse) return;
		if( edit_mode()==='pen' || edit_mode()==='refine')
		{
			if( pendown && point_in_rect(mouse,drawarea))
			{
				buffer.push(mouse);
				if( counter++%2===0)
					redraw();
			}
			if( edit_mode()==='refine' && !pendown)
			{
				selected = select_curve(mouse);
				redraw();
			}
		}
		else if( edit_mode()==='line')
		{
			if( pendown)
			{
				buffer[buffer.length-1] = mouse;
				redraw();
			}
		}
		else if( edit_mode()==='select points')
		{
			if( pendown)
			{
				if( counter++%2===0)
				{
					select_rect.right = xmouse;
					select_rect.bottom = ymouse;
					selected = [];
					for( var i=0; i<curves.length; i++)
					for( var j=0; j<curves[i].length; j++)
					{
						if( point_in_rect(curves[i][j],select_rect))
							selected.push([i,j]);
					}
					redraw();
				}
			}
		}
		else if( edit_mode()==='select curves')
		{
			if( pendown)
			{
				if( counter++%2===0)
				{
					select_rect.right = xmouse;
					select_rect.bottom = ymouse;
					selected = [];
					for( var i=0; i<curves.length; i++)
					for( var j=0; j<curves[i].length; j++)
					{
						if( point_in_rect(curves[i][j],select_rect))
						{
							selected.push(i);
							break;
						}
					}
					redraw();
				}
			}
		}
		else if( edit_mode()==='points')
		{
			if( !pendown)
			{
				var dist, I;
				for( var i=0; i<curves.length; i++)
				for( var j=0; j<curves[i].length; j++)
				{
					var dd = distance(curves[i][j],mouse);
					if( dist===undefined || dd<dist)
					{
						dist = dd;
						I = [i,j];
					}
				}
				selected = I;
			}
			else
			{
				var S = selected;
				curves[S[0]][S[1]] = mouse;
			}
			redraw();
		}
		if( pendown && !point_in_rect(mouse,drawarea))
			onMouseUp();
		lastxmouse=xmouse;
		lastymouse=ymouse;
	}
	function onMouseUp(e)
	{
		if( edit_mode()==='pen')
		{
			if( pendown)
			{
				if( path_length_of(buffer)<5 && buffer.length<8)
				{
					buffer.length = 0;
					redraw();
				}
				if( buffer.length>=2)
				{
					var N = nicer_curve(buffer);
					buffer = [];
					curves_push(N);
				}
				buffer = [];
				pendown = false;
			}
		}
		else if( edit_mode()==='refine')
		{
			if( pendown)
			{
				if( selected!==-1 && typeof selected==='number' && curves[selected] && buffer)
					curves_replace(selected,refine_curve(curves[selected],buffer));
				buffer = [];
				pendown = false;
			}
		}
		else if( edit_mode()==='select points' ||
				 edit_mode()==='select curves' )
		{
			if( pendown)
			{
				pendown = false;
				select_rect = null;
				redraw();
			}
		}
		else if( edit_mode()==='points')
		{
			if( pendown)
			{
				pendown = false;
				var S=selected;
				var O=S.original;
				var N=curves[S[0]][S[1]];
				touch_history(
					function(){curves[S[0]][S[1]]=O},
					function(){curves[S[0]][S[1]]=N}
					);
			}
		}
	}
	function select_curve(P)
	{
		return select_min_i(curves,function(C)
		{
			return select_min_value(C,function(p)
			{
				return distance(p,P);
			});
		});
	}
	
	function point_in_rect(P,R)
	{
		return (inbetween(P.x,R.left,R.right) && inbetween(P.y,R.top,R.bottom));
	}
	function inbetween(x,L,R)
	{
		var l,r;
		if ( L<=R)
		{	l=L;
			r=R;
		}
		else
		{	l=R;
			r=L;
		}
		return x>=l && x<=r;
	}
	function getPositionLeft(){
		var el=div;var pL=0;
		while(el){pL+=el.offsetLeft;el=el.offsetParent;}
		return pL;
	}
	function getPositionTop(){
		var el=div;var pT=0;
		while(el){pT+=el.offsetTop;el=el.offsetParent;}
		return pT;
	}
	
	function nicer_curve(curve)
	{
		curve = poly_super_sample(curve,5);
		curve = agdist_lower_sample(curve,null,null,0.3,true,20);
		return curve;
	}
	function refine_curve(A,B) //modify A to follow B
	{
		var thres = 20;
		var res;
		var A0 = select_min_prof(A,function(a){return distance(a,B[0])});
		var A1 = select_min_prof(A,function(a){return distance(a,B[B.length-1])});
		var B0 = select_min_prof(B,function(b){return distance(b,A[0])});
		var B1 = select_min_prof(B,function(b){return distance(b,A[A.length-1])});
		var A0v = A0.value<thres;
		var A1v = A1.value<thres;
		var B0v = B0.value<thres;
		var B1v = B1.value<thres;
		if( B0v && B1v)
			res = refine(0,A.length,true,true); //whole refinement
		if( A0v && A1v)
			res = refine(A0.i,A1.i,false,false); //section refinement
		if( A0v && B1v)
			res = refine(A0.i,A.length,false,true); //end refinement
		if( B0v && A1v)
			res = refine(0,A1.i,true,false); //head refinement
		if( A0v && B0v)
			res = refine(0,A0.i,true,false); //head reversed
		if( res)
			return nicer_curve(res);
		return A;
		
		function refine(A0,A1,w1,w2)
		{
			if( A1<A0)
			{
				var t=A0;
				A0=A1;
				A1=t;
			}
			var AA = A.slice(A0,A1+1); //target section
			var path_length_of_AA = path_length_of(AA);
			var path_length_of_B = path_length_of(B);
			var denA = path_length_of_AA/AA.length;
			var denB = path_length_of_B/B.length;
			var den = (denA+denB+10)/3;
			AA = poly_resample(AA,path_length_of_AA,denA,den);
			//B = poly_resample( B, path_length_of_B,denB,den);
			//B = nicer_curve(B);
			for( var i=0; i<AA.length; i++)
			{
				//performance: limit to a scope
				if( !AA[i])
					console.log('err');
				var bb = select_min(B,function(b){return distance(b,AA[i])});
				var w = int_weight(i/AA.length,w1,w2);
				AA[i] = {
					x: AA[i].x*(1-w) + bb.x*w,
					y: AA[i].y*(1-w) + bb.y*w
				};
			}
			return A.slice(0,A0).concat(AA).concat(A.slice(A1));
		}
	}
	function int_weight(x,w1,w2)
	{
		if( w1 && x<=0.5)
			return 0.5;
		if( w2 && x>0.5)
			return 0.5;
		/** this is a bell shaped weight function which
			=0.8 when x=0.5
			=0.5 when x=1.0
			=0.1 when x=1.5
			=0.01 when x=2.0
			*/
		var sqrt=Math.sqrt,
			exp=Math.exp,
			pi=Math.PI;
		function sq(x) {return x*x}
		//can be plotted on google graph plotter!
		// (1/(0.75*sqrt(2*pi))*exp(-(x-0.5)^2/(2*(0.2)^2)))
		var ww = (1/(0.75*sqrt(2*pi))*exp(-sq(x-0.5)/(2*sq(0.2))));
		return ww;
	}
	function poly_resample(AA,pathlength,denA,den)
	{
		if( denA < den)
			return num_lower_sample(AA,null,null,Math.round(pathlength/den));
		else
			return poly_super_sample(AA,den);
	}
	function prepare_curves(curves)
	{
		var visualize = false && drawer;
		var paths = clone_array(curves);
		compact_array_array(paths);
		flipy(paths);
		var bound = resize_paths(paths,fit_bound(paths,{w:drawarea.right-drawarea.left,h:drawarea.bottom-drawarea.top}));
		for( var i=0; i<paths.length; i++)
		{
			var resample = false;
			if( resample)
			{
				//if( paths[i].length>10)
				//	paths[i] = paths[i].slice(2,-2);
				//paths[i] = poly_super_sample(paths[i],1/80);
				var npath = agdist_lower_sample(paths[i],null,null,1,true,20);
				if( npath.length>3)
					paths[i] = npath;
			}
			if( visualize)
			{
				subplotshape(drawer,bound,paths[i],{num:0,style:'point:0',closepath:false});
				subplotshape(drawer,bound,paths[i],{num:0,style:'line:0',closepath:false});
			}
		}
		return paths;
		
		function flipy(ss)
		{
			for( var i=0; i<ss.length; i++)
			for( var j=0; j<ss[i].length; j++)
				ss[i][j].y = -ss[i][j].y;
		}
		function fit_bound(strokes,S)
		{
			var B = get_paths_bound(strokes);
			var cx = (B.xmax+B.xmin)/2,
				cy = (B.ymax+B.ymin)/2;
			var BB = {
				xmin:cx-S.w/2,
				xmax:cx+S.w/2,
				ymin:cy-S.h/2,
				ymax:cy+S.h/2,
				width:S.w,
				height:S.h
			}
			return BB;
		}
	}
	function compact_array(sp)
	{
		for( var i=0; i<sp.length; i++)
			if( !sp[i])
			{
				sp.splice(i,1);
				i--;
			}
	}
	function compact_array_array(sp)
	{
		for( var i=0; i<sp.length; i++)
			if( !sp[i].length)
			{
				sp.splice(i,1);
				i--;
			}
	}
}