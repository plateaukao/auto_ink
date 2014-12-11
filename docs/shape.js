function decompose_path(path)
{
	var group = document.createElement('div');
	group.className = 'group';
	$('container1').appendChild(group);
	current_group = group;
	
	//display original shape in standalone svg
	if (hollow_scheme)
	{
		var d = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		d.setAttribute('width','100');
		d.setAttribute('height','100');
		d.setAttribute('version','1.1');
		path = path.cloneNode();
		d.appendChild(path);
		group.appendChild(d);
		var box = d.getBBox(), boxpadding = 5;
		d.setAttribute('viewBox', [box.x-boxpadding,box.y-boxpadding,box.width+2*boxpadding,box.height+2*boxpadding].join(' '));
	}
	
	//final result viewer
	var div = document.createElement('div');
	div.className = 'viewerbox';
	current_group.appendChild(div);
	var drawer = new Drawer(div);
	
	var paths = split_path(path),
		shapes = [],
		len0 = paths[0].getTotalLength();
	for( var i=0; i<paths.length; i++)
	{
		if( i===0)
			shapes[i] = sample_path(paths[i],sampling_density,true);
		else
		{
			var len = paths[i].getTotalLength();
			shapes[i] = sample_path(paths[i],Math.round(Math.sqrt(len/len0)*sampling_density),true);
		}
		if( !hollow_scheme)
			break;
	}
	
	var base = metrics(shapes[0]),
		result = process_shape(shapes);
	result.s=1;
	if( shapes.length>1)
		result.s=0.3;
	if( hollow_scheme)
		result.q = 0;
	else
		result.q = angle(shapes[0][0],shapes[0][1]);
	result.x=0;
	result.y=0;
	
	//draw original shape
	if( !hollow_scheme)
		draw_shape(base.shape.data,[{s:result.s,q:result.q,x:result.x,y:result.y}],{
			drawer:drawer, color:0, closepath:true,
			xrange:0.5, yrange:0.5, //the max. size of a shape
			xoffset:0.25-base.centerx, yoffset:0.25-base.centery,
			width:100, height:100,
			num:-0.1
		});
	//result shape
	render_result(result,[]);
	
	function metrics(shape)
	{
		var st = transform(shape),
			re = reconstruct(st);
		return {shape:re,centerx:re.centerx,centery:re.centery,width:re.width,height:re.height};
	}
	function render_result(result,hier)
	{
		hier = hier.slice(0); //clone array
		hier.push({s:result.s,q:result.q,x:result.x,y:result.y});
		if( result.children)
			for( var i in result.children)
				render_result(result.children[i],hier);
		else if( result.shape)
		{
			var size = Math.max(base.width,base.height)+0.1; //dynamic fit
			for( var i=0; i<result.shape.length; i++)
				draw_shape(result.shape[i].data,hier,{
					drawer:drawer, color:0, closepath:true,
					xrange:size, yrange:size, //the max. size of a shape
					xoffset:size/2-base.centerx, yoffset:size/2-base.centery,
					width:100, height:100,
					num:1
				});
			if( result.axis)
			{
				if( result.shape.length==1) //ignor stroke loops
					strokes.push({
						shape:result.shape[0],
						axis:result.axis,
						skeleton:result.skeleton
					});
				draw_shape(result.axis,hier,{
					drawer:drawer, color:0,
					xrange:size, yrange:size, //the max. size of a shape
					xoffset:size/2-base.centerx, yoffset:size/2-base.centery,
					width:100, height:100,
					num:2
				});
			}
		}
	}
}
function process_shape(shapes)
{
	var visualize = true;
	//plot graphs
	var div = document.createElement('div');
	div.className = 'viewer';
	current_group.appendChild(div);
	var drawer = new Drawer(div,110,110);

	//basic operations
	var st=[],re=[],dst=[],ah=[];
	for( var i=0; i<shapes.length; i++)
	{
		if( hollow_scheme)
		{
			//var ag = -st[i].initangle;
			//if( ag<0) ag+=2*Math.PI;
			//var index = search_closest(st[i],'q',ag);
			//shapes[i] = O_shift(shapes[i],index);
			//st[i] = transform(shapes[i].slice(0,10),false,undefined,st[0].pathlength);
			st[i] = transform(shapes[i],false,true,i===0?undefined:st[0].pathlength);
			ah[i]= {ag:st[i][0].initangle,
					x:(shapes[i][0].x-shapes[0][0].x)/st[0].pathlength,
					y:(shapes[i][0].y-shapes[0][0].y)/st[0].pathlength};
		}
		else
			st[i] = transform(shapes[i]);
	}
	for( var i=0; i<st.length; i++)
	{
		if( i===0)
			re[i] = reconstruct(st[i]);
		else
		{
			re[i] = reconstruct(st[i],{x:ah[i].x,y:ah[i].y});
			re[i].centerx = re[0].centerx;
			re[i].centery = re[0].centery;
			re[i].width = re[0].width;
			re[i].height = re[0].height;
		}
	}
	dst = fn(differentiate,st,'q','l');
	
	function search_closest(arr,prop,target)
	{
		var index=0, value=arr[0][prop];
		for( var i=0; i<arr.length; i++)
		{
			var nvalue = arr[i][prop];
			if( adiff(nvalue,target) < adiff(value,target))
			{
				value = nvalue;
				index = i;
			}
		}
		return index;
	}
	
	//visualize
	if( visualize)
	{
		for( var i=0; i<re.length; i++)
		{
			var size = Math.max(re[i].width,re[i].height)+0.1;
			subplot({
				drawer:drawer, data:re[i].data, closepath:true,
				x:'x', y:'y',
				xrange:size, yrange:size,
				xoffset:size/2-re[i].centerx, yoffset:size/2-re[i].centery,
				width:100, height:100,
				num:0, title:'reconstruction'
			});
		}
		subplot({
			drawer:drawer, data:st[0],
			x:'l', y:'q',
			xrange:1, yrange:2*Math.PI,
			width:100, height:100,
			num:1, title:'angle-distance'
		});
		subplot({
			drawer:drawer, data:dst[0],
			x:'x', y:'dydx',
			xrange:1, yrange:2*Math.PI, yoffset:Math.PI,
			width:100, height:100,
			num:2, title:'diff-angle-distance'
		});
		/*subplot({
			drawer:drawer, data:st[0],
			x:'l', y:'d',
			xrange:1, yrange:1,
			width:100, height:100,
			num:3, title:'displacement-distance'
		});*/
	}
	
	var processed = decompose(drawer,re,st,dst),
		result = {};
	if( processed.shape) //non decomposable shape
	{
		result.shape = processed.shape;
		result.shape = fn(function(re){return shape_bounds(super_sample(re.data,1/50));},processed.shape);
		//result.shape = fn(reconstruct,fn(transform,susp));
		if( 2 <= computation_to_stage)
		{
			result.axis = principal_axis(drawer,re,st,dst);
			//result.axis = num_lower_sample(principal_axis(drawer,re,st,dst),null,null,Math.round(result.shape[0].data.length/5));
			if( 3 <= computation_to_stage)
				if( result.axis && result.shape.length==1) //ignor stroke loops
					result.skeleton = skeletonize(drawer,result.shape[0],result.axis);
		}
	}
	else //holder of shape
		result.children = processed;
	result.x = shapes[0][0].x; //position
	result.y = shapes[0][0].y; //
	if( hollow_scheme)
		result.q = 0;
	else
		result.q = angle(shapes[0][0],shapes[0][1]); //angle
	result.s = distance(shapes[0][0],shapes[0][1])/distance(re[0].data[0],re[0].data[1]); //size
	return result;
}

function draw_shape(shape,hier,style)
{
	var drawer = style.drawer,
		color = style.color?style.color:0,
		data = shape;
	if( data.length>0)
		drawer.moveTo( trans(data[0]['x'],data[0]['y']), color);
	for( var i=0; i<data.length; i++)
		drawer.lineTo( trans(data[i]['x'],data[i]['y']), color);
	if( style.closepath)
		drawer.lineTo( trans(data[0]['x'],data[0]['y']), color);
	drawer.draw();
	function trans(x,y)
	{
		//go through the hierarchy of coordinate transform
		for ( var i=hier.length-1; i>=0; i--)
		{
			var s=hier[i].s, q=hier[i].q, tx=hier[i].x, ty=hier[i].y;
			x*=s; y*=s; //scale
			var ox=x,oy=y;
			x = ox*Math.cos(q) - oy*Math.sin(q), //rotate
			y = oy*Math.cos(q) + ox*Math.sin(q);
			x+=tx; y+=ty; //translate
		}
		//object to screen space
		return { x:(x+style.xoffset)/style.xrange*style.width, y:style.height-(y+style.yoffset)/style.yrange*style.height+style.num*(style.height+10)};
	}
}
//input: array of points {x,y}
//return: array of {l,q,d}
function transform(ss,linear,absolute_angle,normal_length)
{
	var st = [];
	var pathlength=0;
	var initangle, initx=ss[0].x, inity=ss[0].y;
	var maxdp = 0;
	for( var i=0; i<ss.length; i++)
	{
		var vx,vy;
		if( i<ss.length-1)
		{
			vx = ss[i+1].x-ss[i].x; vy = ss[i+1].y-ss[i].y;
		}
		else
		{
			if( linear) break;
			//circular domain
			vx = ss[0].x-ss[i].x; vy = ss[0].y-ss[i].y;
		}
		var L = Math.sqrt(vx*vx+vy*vy);
		vx/=L; //normalize
		//angle
		var ag = Math.acos(vx);
		if( vy<0)
			ag = -ag;
		if( i===0)
			initangle = ag;
		if( !absolute_angle)
			ag = ag-initangle;
		if( ag<-0.0001) ag += 2*Math.PI; //make range 0 ~ 2pi
		//if( ag<-Math.PI) ag += 2*Math.PI; //make range -pi ~ 2pi
		//if( i>0 && Math.abs(ag-st[i-1].q)>Math.PI) //force continunity with previous point
		//	ag += 2*Math.PI*(ag-st[i-1].q>0?-1:1);
		//displacement
		var dp;
		if( i===0)
			dp = 0;
		else
			dp = Math.sqrt((ss[i].x-initx)*(ss[i].x-initx)+(ss[i].y-inity)*(ss[i].y-inity));
		if( dp>maxdp) maxdp = dp;
		//push
		st[i] = {l:pathlength, q:ag, d:dp};
		if( i===0)
			st[i].initangle = initangle;
		/*if( i===ss.length-1 && linear)
		{
			st[i].q = 0;
			break;
		}*/
		pathlength+=L;
	}
	for( var i=0; i<st.length; i++)
	{
		if( normal_length)
			st[i].l/=normal_length; //normalize to given range
		else
			st[i].l/=pathlength; //normalize to range 0~1
		st[i].d/=maxdp; //normalize to range 0~1
	}
	st.initangle = initangle;
	st.pathlength = pathlength;
	return st;
}
//input: array of {l,q}
//output: { data:array of {x,y},,,}
function reconstruct(st,initpos,linear)
{
	var ss = [];
	var pt = initpos || {x:0,y:0};
	ss.push(pt);
	for( var i=1; i<st.length; i++)
	{
		var vx = Math.cos(st[i-1].q)*(st[i].l-st[i-1].l),
			vy = Math.sin(st[i-1].q)*(st[i].l-st[i-1].l);
		pt={x:pt.x+vx,y:pt.y+vy,l:st[i].l};
		ss.push(pt);
	}
	if( linear)
	{
		var vx = Math.cos(st[i-1].q)*(1-st[i-1].l),
			vy = Math.sin(st[i-1].q)*(1-st[i-1].l);
		pt={x:pt.x+vx,y:pt.y+vy,l:1};
		ss.push(pt);
	}
	return shape_bounds(ss);
}
function shape_bounds(ss,no_data)
{
	var sum={x:0,y:0};
	var xmin,xmax,ymin,ymax;
	for( var i=0; i<ss.length; i++)
	{
		var pt = ss[i];
		sum.x+=pt.x; sum.y+=pt.y;
		if( xmin===undefined || pt.x<xmin) xmin=pt.x;
		if( xmax===undefined || pt.x>xmax) xmax=pt.x;
		if( ymin===undefined || pt.y<ymin) ymin=pt.y;
		if( ymax===undefined || pt.y>ymax) ymax=pt.y;
	}
	sum.x/=ss.length;
	sum.y/=ss.length;
	var bound = {
		centerx:(xmin+xmax)/2,
		centery:(ymin+ymax)/2,
		//centerx:sum.x,
		//centery:sum.y,
		width:xmax-xmin,
		height:ymax-ymin
	};
	if( !no_data)
		bound.data = ss;
	return bound;
}
function filter(signal,window_width,filter_function)
{
	var ss=signal,ww=window_width;
	var output=[];
	for( var i=0; i<ss.length; i++)
	{
		var window=[];
		for( var j=-Math.floor(ww/2); j<ww/2; j++)
			window.push(O_get(ss,i+j)); //circular
		var res = filter_function( i, window);
		if( res!==undefined)
		{
			output.push(res);
		}
	}
	return output;
}
function differentiate(data,y,x,linear) //delta y over x
{
	if( !y) y='q';
	if( !x) x='l';
	var out = [];
	for( var i=0; i<data.length; i++)
	{
		var dy,dx;
		if( i===0)
		{
			if( linear)
				dy = 0;
			else
				dy = data[i][y]-data[data.length-1][y]; //circular domain
			dx = data[i][x]-data[data.length-1][x]+1;
		}
		else
		{
			dy = data[i][y]-data[i-1][y];
			dx = data[i][x]-data[i-1][x];
		}
		var dydx = value(dy,dx);
		out[i] = {
			dydx: dydx,
			x: data[i][x]
		};
	}
	function value(dy,dx)
	{
		if( dy>Math.PI) dy = dy-2*Math.PI; //circular range
		else if( dy<-Math.PI) dy = 2*Math.PI+dy;
		var dydx = dy/dx/20;
		if( dydx>Math.PI) dydx = Math.PI; //impulse trim off
		else if( dydx<-Math.PI) dydx = -Math.PI;
		return dydx;
	}
	return out;
}
function difference(data,linear)
{
	var y='q';
	var out = [];
	for( var i=0; i<data.length; i++)
	{
		var dy;
		if( i===0)
			if( linear)
				dy = 0;
			else
				dy = agdiff(data[i][y],data[data.length-1][y]); //circular domain
		else
			dy = agdiff(data[i][y],data[i-1][y]);
		out[i] = dy;
	}
	return out;
}
//! change the input shape
function normalize(st)
{
	var sum = 0;
	for( var i=0; i<st.length; i++)
		sum += st[i].l;
	for( var i=0; i<st.length; i++)
		st[i].l /= sum;
	return st;
}
function has_duplicate(sp) //consecutive duplicate
{
	for( var i=0; i<sp.length-1; i++)
	{
		if( Math.abs(sp[i].x-sp[i+1].x) < 0.0001 && 
			Math.abs(sp[i].y-sp[i+1].y) < 0.0001)
			return true;
	}
}
function remove_duplicate(sp,thres,silent) //remove consecutive duplicates
{
	if(!thres) thres = 0.0001;
	for( var i=0; i<sp.length-1; i++)
	{
		if( Math.abs(sp[i].x-sp[i+1].x) < thres && 
			Math.abs(sp[i].y-sp[i+1].y) < thres)
		{
			if( !silent)
				console.log('has duplicate');
			sp.splice(i,1);
			i--;
		}
	}
	return sp;
}
function smooth_bridge(spa,a,spb,b,smoothness,samples)
{
	var S=smoothness || 3;
	var A1=O_get(spa,a-1), A0=O_get(spa,a),
		B1=O_get(spb,b+1), B0=O_get(spb,b),
		gap=distance(A0,B0),
		A = {x:A0.x-A1.x, y:A0.y-A1.y},
		AL= Math.sqrt(A.x*A.x+A.y*A.y),
		B = {x:B0.x-B1.x, y:B0.y-B1.y},
		BL= Math.sqrt(B.x*B.x+B.y*B.y),
		fac= S/AL*gap/2,
		AL = {x:A0.x+fac*A.x, y:A0.y+fac*A.y},
		BL = {x:B0.x+fac*B.x, y:B0.y+fac*B.y};
	return create_curve(A0,AL,BL,B0,samples);
}
function straight_bridge(spa,a,spb,b,samples)
{
	return create_line(O_get(spa,a),O_get(spb,b),samples);
}
function create_curve(A,B,C,D,samples) //create a cubic bezier section
{
	var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d','M'+A.x+','+A.y+'C'+B.x+','+B.y+' '+C.x+','+C.y+' '+D.x+','+D.y);
	return sample_path(path,samples);
}
function create_line(A,B,samples) //create a line section
{
	var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d','M'+A.x+','+A.y+'L'+B.x+','+B.y);
	return sample_path(path,samples);
}
function sample_path(path,steps,flipy)
{
	var step = path.getTotalLength()/steps;
	var shape = []; //array of points format
	for( var i=0; i<steps; i++)
	{
		var p = path.getPointAtLength(i*step);
		p = {x:p.x,y:(flipy?-1:1)*p.y};
		shape[i] = p;
	}
	return shape;
}
function construct_svgpathstring(sp,closepath)
{
	var d = '';
	for( var i=0; i<sp.length; i++)
		d += ''+(i===0?'M':'L')+sp[i].x+','+sp[i].y;
	if( closepath)
		d += 'z';
	return d;
}
function construct_svgpath(sp,closepath)
{
	var d = construct_svgpathstring(sp,closepath);
	var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
	path.setAttribute('d',d);
	return path;
}
function split_path(path)
{
	var d = path.getAttribute('d').split('z'),
		N = d.length-1; //number of sub sections
	if( N===0 || N===1)
		return [path];
	var paths = [];
	for( var i=0; i<N; i++)
	{
		var pp = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		var dd = d[i]+'z';
		if( dd.indexOf(' ')===0) dd=dd.slice(1);
		if( i>0)
		if( dd.indexOf('m')===0)
		{	//fix the relative m
			var index = dd.indexOf(' ',2);
			var mp = dd.slice(1,index);
			mp = mp.split(',');
			mp = fn(parseFloat,mp);
			dd = dd.slice(index);
			var has_cmd = false;
			for( var x=0; x<4; x++)
				if( dd.charAt(x) in values('l','c','m','q'))
					has_cmd = true;
			var lastp = paths[i-1].getPointAtLength(0);
			dd = 'M '+(lastp.x+mp[0])+','+(lastp.y+mp[1])+(has_cmd?' ':' l ')+dd;
			//console.log(dd);
		}
		pp.setAttribute('d',dd);
		paths.push(pp);
	}
	return paths;
	function values()
	{
		var obj = {};
		for( var i=0; i<arguments.length; i++)
			obj[arguments[i]] = null;
		return obj;
	}
}
function is_closed_path(path)
{
	var len = path.getTotalLength(),
		A = path.getPointAtLength(0),
		B = path.getPointAtLength(len*0.01),
		C = path.getPointAtLength(len*0.99);
	return Math.abs(distance(A,B)-distance(A,C))<len*0.03;
}
function resize_paths(paths,input_bound)
{
	//resize the shape to fit into unit bound
	if( paths)
	{
		var B;
		if( input_bound)
			B = input_bound;
		else
			B = get_paths_bound(paths);
		for( var i=0; i<paths.length; i++)
		{
			var len = 0;
			for( var j=0; j<paths[i].length; j++)
			{
				var pt = paths[i][j];
				var wh = Math.max(B.width,B.height);
				pt.x = (pt.x-B.xmin)/wh;
				pt.y = (pt.y-B.ymin)/wh;
				if( j>0)
				{
					len+=distance(paths[i][j],paths[i][j-1]);
				}
			}
			paths[i].path_length = len;
		}
	}
	return {
		centerx:0.5, centery:0.5,
		width:1, height:1
	};
}
function path_length_of(s)
{
	var d = 0;
	for( var i=1; i<s.length; i++)
		d += distance(s[i-1],s[i]);
	return d;
}
function get_paths_bound(ss)
{
	var sum={x:0,y:0},num=0;
	var xmin,xmax,ymin,ymax;
	for( var i=0; i<ss.length; i++)
	for( var j=0; j<ss[i].length; j++)
	{
		num++;
		var pt = ss[i][j];
		sum.x+=pt.x; sum.y+=pt.y;
		if( xmin===undefined || pt.x<xmin) xmin=pt.x;
		if( xmax===undefined || pt.x>xmax) xmax=pt.x;
		if( ymin===undefined || pt.y<ymin) ymin=pt.y;
		if( ymax===undefined || pt.y>ymax) ymax=pt.y;
	}
	sum.x/=num;
	sum.y/=num;
	return {
		centerx:sum.x,
		centery:sum.y,
		xmin:xmin,
		xmax:xmax,
		ymin:ymin,
		ymax:ymax,
		width:xmax-xmin,
		height:ymax-ymin
	}
}
function super_sample(sp,den)
{
	var nsp=[];
	for( var i=0; i<sp.length; i++)
	{
		var A=O_get(sp,i),
			B=O_get(sp,i+1),
			dist=distance(A,B);
		if( dist > den)
			nsp = nsp.concat(smooth_bridge(sp,i,sp,i+1,0.35,Math.floor(dist/den)+1));
		else
			nsp.push(A);
	}
	if( has_duplicate(nsp)) console.log('has duplicate after super sampling');
	return nsp;
}
function angle(A,B)
{
	var vx=B.x-A.x, vy=B.y-A.y;
	var L = Math.sqrt(vx*vx+vy*vy);
	vx/=L; //normalize
	var ag = Math.acos(vx);
	if( vy<0) ag = -ag; //-pi~pi angle
	return ag;
}
function full_angle(A,B)
{
	var ag = angle(A,B);
	if( ag<0) ag+=2*Math.PI;
	if( ag>2*Math.PI) ag-=2*Math.PI;
	return ag;
}
function agdiff(a,b)
{
	var dy=a-b;
	if( dy>Math.PI) dy = dy-2*Math.PI; //circular range
	else if( dy<-Math.PI) dy = 2*Math.PI+dy;
	return dy;
}
function adiff(a,b)
{
	var dy=a-b;
	if( dy>Math.PI) dy = dy-2*Math.PI; //circular range
	else if( dy<-Math.PI) dy = 2*Math.PI+dy;
	return dy>=0? dy:-dy;
}