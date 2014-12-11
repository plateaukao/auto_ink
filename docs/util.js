function viewer_group()
{
	var column = document.createElement('div');
	column.className = 'group';
	$('container').appendChild(column);
	current_group = column;
	return column;
}
function viewer_box(classname,width,height)
{
	var div = document.createElement(Drawer.tagname);
	classname = classname || 'viewerbox';
	div.className = classname;
	current_group.appendChild(div);
	return new Drawer(div,width,height);
}
function subplot(graph)
{
	var data = graph.data,
		label = graph.label,
		x = graph.x,
		y = graph.y,
		drawer = graph.drawer;

	if( data)
	if( !graph.style || //default style
		graph.style.indexOf('line')===0 ||
		graph.style.indexOf('arrow')===0 ||
		graph.style.indexOf('fill')===0 )
	{
		var xxTo = 'lineTo';
		if( graph.style && graph.style.indexOf('arrow')===0)
			xxTo = 'arrowTo';
		var color = (graph.style && graph.style.split(':').length>=2)?graph.style.split(':')[1]:0; //default black
		for( var i=0; i<data.length; i++)
			if( data[i]) {
				drawer.moveTo( trans(data[i][x],data[i][y]), color);
				break;
			}
		for( var i=0; i<data.length; i++)
		{
			if( data[i])
				drawer[xxTo]( trans(data[i][x],data[i][y]), color);
		}
		if( graph.closepath)
			for( var i=0; i<data.length; i++)
				if( data[i]) {
					drawer[xxTo]( trans(data[i][x],data[i][y]), color);
					break;
				}
	}
	else if( graph.style.indexOf('point')===0)
	{
		var para = graph.style.split(':'),
			color = para[1] || 1,
			size = para[2] || 1.2;
		for( var i=0; i<data.length; i++)
		{
			if( data[i])
				drawer.point( trans(data[i][x],data[i][y]), size, color);
		}
	}
	else if( graph.style.indexOf('segment')===0)
	{
		var color = (graph.style.split(':').length>=2)?graph.style.split(':')[1]:3; //default blue
		for( var i=0; i<data.length; i+=2)
		{
			if( data[i])
			{
				drawer.moveTo( trans(data[i][x],data[i][y]), color);
				drawer.lineTo( trans(data[i+1][x],data[i+1][y]), color);
			}
		}
	}
	if( label)
	{
		for( var i=0; i<label.length && i<data.length; i++)
		{
			if( !label[i] || !data[i])
				continue;
			var P = trans(data[i][x],data[i][y]);
			drawer.text(P.x,P.y,label[i]);
		}
	}
	if( graph.title)
	{
		drawer.text(graph.width/2, (graph.num)*(graph.height+10)+graph.height+5, graph.title);
		drawer.rect(0,graph.num*(graph.height+10),graph.width,graph.height,4);
	}
	var hold_stroke_width = drawer.stroke_width;
	if( graph.stroke_width)
		drawer.stroke_width = graph.stroke_width;
	var drawn = drawer.draw(graph.style && graph.style.indexOf('fill')===0);
	drawer.stroke_width = hold_stroke_width;
	return drawn;
	function trans(x,y)
	{
		return { x:(x+(graph.xoffset||0))/graph.xrange*graph.width, y:graph.height-(y+(graph.yoffset||0))/graph.yrange*graph.height+graph.num*(graph.height+10)};
	}
}
function subplotshape(drawer,re,data,graph_config)
{
	var zoom = (graph_config&&graph_config.zoom) || 0;
	var size;
	if( zoom===0 && re)
		size = Math.max(re.width,re.height)+0.1; //dynamic fit
	else
		size = 0.5; //fixed scale zoom
	var graph =
	{
		drawer:drawer, data:data, closepath:true,
		x:'x', y:'y',
		xrange:size-zoom, yrange:size-zoom,
		xoffset:size/2-zoom/2-(re?re.centerx:0), yoffset:size/2-zoom/2-(re?re.centery:0),
		width:drawer.width-10, height:drawer.height-10,
		num:0, style:'line:0'
	}
	if( graph_config)
	for( var i in graph_config)
		graph[i] = graph_config[i];
	return subplot(graph);
}
function get_subplot_graph_zoom(drawer,re,zoom)
{
	if(!zoom)zoom=0;
	var size=0.5;
	var graph =
	{
		xrange:size-zoom, yrange:size-zoom,
		xoffset:size/2-zoom/2-(re?re.centerx:0), yoffset:size/2-zoom/2-(re?re.centery:0),
		width:drawer.width-10, height:drawer.height-10,
		num:0
	}
	return graph;
}
function get_screen_transform_fun(graph)
{
	function trans(P,object_to_screen_space)
	{
		if( object_to_screen_space)
			return { x:(P.x+graph.xoffset)/graph.xrange*graph.width, y:graph.height-(P.y+graph.yoffset)/graph.yrange*graph.height+graph.num*(graph.height+10)};
		else //inverse: screen to object space
			return { x:P.x*graph.xrange/graph.width-graph.xoffset, y:-1*(P.y-graph.num*(graph.height+10)-graph.height)*graph.yrange/graph.height-graph.yoffset};
	}
	return trans;
}
/**
//! change the input array!
function remove_duplicate(arr) //remove adjacent duplicates
{
	for( var i=0; i<arr.length; i++)
	{
		for( var k=i+1; k<arr.length; k++)
			if( arr[k]===arr[i])
			{
				arr.splice(i,1);
				i--;k--;
			}
			else
				break;
	}
	return arr;
}*/
/**
arr1 = [{a,b},{e,f},,,]
arr2 = [{c,d},{g,h},,,]
return = [{a,b,c,d},{e,f,g,h}]
shallow copy
*/
function merge_arrays(arr1,arr2/*,,,*/)
{
	var res=[];
	for( var g=0; g<arguments.length; g++)
	{
		var arr = arguments[g];
		for( var i=0; i<arr.length; i++)
		{
			if( !res[i]) res[i] = {};
			for( var j in arr[i])
				res[i][j] = arr[i][j];
		}
	}
	return res;
}
function clone_array(A)
{
	var B=[];
	for( var i=0; i<A.length; i++)
	{
		if( A[i] instanceof Array)
		{
			B[i] = clone_array(A[i]);
		}
		else if( typeof A[i]==='object')
		{
			B[i] = {};
			for( var j in A[i])
				B[i][j] = A[i][j];
		}
		else
			B[i] = A[i];
	}
	return B;
}
function Array2D(X,Y)
{
	var A = new Array(X);
	for( var i=0; i<A.length; i++)
	{
		A[i] = new Array(Y);
		for( var j=0; j<A[i].length; j++)
			A[i][j] = 0;
	}
	return A;
}
function fn(method,arr/*,arg*/) //apply method on each of arr and return the result
{
	var arg = Array.prototype.slice.call(arguments,2);
	if( !arg) arg = [];
	var res = [];
	for( var i=0; i<arr.length; i++)
		res[i] = method.apply(null, [arr[i]].concat(arg));
	return res;
}
function fnI(method,arr/*,arg*/) //apply method on each of arr and return the result
{
	var arg = Array.prototype.slice.call(arguments,2);
	if( !arg) arg = [];
	var res = [];
	for( var i=0; i<arr.length; i++)
		res[i] = method.apply(null, [i,arr[i]].concat(arg));
	return res;
}
/** input:  arr [[a,b],[c,d]]
	output: arr [a,b,c,d]
 */
function flatten(arr)
{
	var flat = [];
	for( var i=0; i<arr.length; i++)
		flat = flat.concat(arr[i]);
	return flat;
}
function exists(arr,A)
{
	for( var i=0; i<arr.length; i++)
	{
		var equal = true;
		for( var j in A)
			if( A[j]!==arr[i][j])
				equal = false;
		if( equal)
			return true;
	}
}
function select_best(arr,better)
{
	var best, besti, value;
	for( var i=0; i<arr.length; i++)
	{
		if( value===undefined || better(arr[i],value))
		{
			value = arr[i];
			best = arr[i];
			besti = i;
		}
	}
	return best;
}
function select_min(arr,valuer)
{
	var best, besti, value;
	for( var i=0; i<arr.length; i++)
	{
		var V = valuer(arr[i]);
		if( value===undefined || V < value)
		{
			value = V;
			best = arr[i];
			besti = i;
		}
	}
	return best;
}
function select_min_prof(arr,valuer)
{
	var best, besti, value;
	if( !arr || !arr instanceof Array)
		return;
	for( var i=0; i<arr.length; i++)
	{
		var V = valuer(arr[i]);
		if( value===undefined || V < value)
		{
			value = V;
			best = arr[i];
			besti = i;
		}
	}
	return {
		obj:best,
		i:besti,
		value:value
	};
}
function select_min_i(arr,valuer)
{
	var best, besti, value;
	for( var i=0; i<arr.length; i++)
	{
		var V = valuer(arr[i]);
		if( value===undefined || V < value)
		{
			value = V;
			best = arr[i];
			besti = i;
		}
	}
	return besti;
}
function select_min_value(arr,valuer)
{
	var best, besti, value;
	for( var i=0; i<arr.length; i++)
	{
		var V = valuer(arr[i]);
		if( value===undefined || V < value)
		{
			value = V;
			best = arr[i];
			besti = i;
		}
	}
	return value;
}
function binary_search(array,property,value)
{
	var minIndex = 0, maxIndex = array.length - 1;
	var index, currentValue;

	while (minIndex <= maxIndex)
	{
		index = Math.floor((minIndex + maxIndex)/2);
		currentValue = array[index][property];
		if (currentValue < value)
			minIndex = index + 1;
		else if (currentValue > value)
			maxIndex = index - 1;
		else
			return array[index];
	}
	if (minIndex===maxIndex)
	{
		console.log('search closest: search for:'+value+', found:'+currentValue);
		return array[index]; //closest match
	}
}
function location_parameters()
{
	var param = window.location.href.split('/').pop(),
		query = {};
	if( param.indexOf('?')!==-1)
	{
		var param = param.split('?').pop().split('&');
		for( var i=0; i<param.length; i++)
		{
			pp = param[i].split('=');
			if( pp.length===1)
				query[pp[0]] = 1;
			if( pp.length===2)
				query[pp[0]] = pp[1];
		}
	}
	return query;
}
function export_file(text)
{
	window.open('data:,'+text);
}
function O_shift(A,x)
{
	return A.slice(x).concat(A.slice(0,x));
}
function O_slice(A,a,b) //circular slice
{
	a = O_index(A,a);
	b = O_index(A,b);
	if( a<b)
		return A.slice(a,b);
	else
		return A.slice(a).concat(A.slice(0,b));
}
function OS_get(A,s,i) //slotted circular get
{
	return O_get(A[s],i);
}
function O_get(A,i) //circular get
{
	if( i>=0)
		return A[i%A.length];
	else
		return A[(A.length+i%A.length)%A.length];
}
function O_index(A,i) //return correct circular index
{
	if( i>=0)
		return i%A.length;
	else
		return (A.length+i%A.length)%A.length;
}
function O_set(A,i,P) //circular set
{
	if( i>=0)
		A[i%A.length] = P;
	else
		A[(A.length+i%A.length)%A.length] = P;
}
function $(id)
{
	return document.getElementById(id);
}
function distance(p1,p2)
{
	return Math.sqrt( (p2.x-p1.x)*(p2.x-p1.x) + (p2.y-p1.y)*(p2.y-p1.y) );
}
function signed_area(P1,P2,P3)
{
	//value is greater than 0 if triangle is clockwise (i.e. upperleft origin)
	return (P2.x-P1.x)*(P3.y-P1.y) - (P3.x-P1.x)*(P2.y-P1.y);
}
var V = {
	midpoint:function(A,B)
	{
		return {x:(A.x+B.x)/2, y:(A.y+B.y)/2};
	},
	length:function(A)
	{
		return Math.sqrt(A.x*A.x+A.y*A.y);
	},
	add:function(A,B) //A+B
	{
		return {x:A.x+B.x, y:A.y+B.y};
	},
	sub:function(A,B) //A-B
	{
		return {x:A.x-B.x, y:A.y-B.y};
	},
	scale:function(A,r) //A*r
	{
		return {x:A.x*r, y:A.y*r};
	},
	angle:function(A)
	{
		var vx=A.x, vy=A.y;
		var L = Math.sqrt(vx*vx+vy*vy);
		vx/=L; //normalize
		var ag = Math.acos(vx);
		if( vy<0) ag = -ag; //-pi~pi angle
		return ag;
	}
};