function prepare_component(o_path,detail,smoothness)
{
	var mul = 1/detail || 1,
		smm = 1/smoothness || 1;
	o_path = clone_array(o_path);
	mark(o_path);
	var path = agdist_lower_sample(o_path,null,null,1*smm,true);
	path = ag_lower_sample(path,null,null,Math.PI*0.15*smm,true);
	path.path_length = path_length(path);
	remove_small(path);
	path.path_length = path_length(path);
	if( path[0].i >= path[path.length-1].i)
		console.log(o_path,path);
	if( path.length<2)
		console.log('point component?',path,o_path);
	return path;
	
	function remove_small(path)
	{
		if( path.length>=3)
		for( var i=0; i<path.length-1; i++)
		{
			var d0 = i>0? distance(path[i],path[i-1]):10,
				d1 = distance(path[i],path[i+1]),
				r0 = d0/path.path_length,
				r1 = d1/path.path_length;
			var ag = 10;
			if( i>0)
				ag = adiff(angle(path[i-1],path[i]),angle(path[i],path[i+1]));
			//else if( i===0 && i<path.length-2)
			//	ag = adiff(angle(path[i],path[i+1]),angle(path[i+1],path[i+2]));
			if( ((i==0||i==path.length-1)? (d1<0.04*mul && r1<0.05*mul):true) &&
				(d1<0.04*mul && r1<0.1*mul) || 
				(d1<0.02*mul && r1<0.4*mul) )
			{
				//var label = Math.round(d1*100)/100+','+Math.round(r1*100)/100;
				//subplotshape(drawer,bound,[path[i]],{style:'point:1',label:[label]});
				path.splice(i,1);
				i--;
			}
			else if( (r0<0.3*mul || r1<0.3*mul) && ag < Math.PI*0.3*mul)
			{
				var tt = 1;
				if( i>0)
					tt = r0<r1? -1:1;
				var mid = {
					x:(path[i].x+path[i+tt].x)/2,
					y:(path[i].y+path[i+tt].y)/2,
					i:path[i+(tt==1?0:-1)].i
				}
				path.splice(i+(tt==1?0:-1),2,mid); //merge the points
			}
			if( path.length<=2)
				break;
		}
		if( 0)
		if( path.length===3)
			if( adiff(angle(path[0],path[1]),angle(path[1],path[2])) < Math.PI*0.25*mul)
				path.splice(1,1);
	}
	function path_length(path)
	{
		var len = 0;
		for( var i=0; i<path.length-1; i++)
		{
			len+=distance(path[i],path[i+1]);
		}
		return len;
	}
	function mark(arr)
	{
		for( var i=0; i<arr.length; i++)
			arr[i].i = i;
		return arr;
	}
}

function analyse_component(drawer,bound,comps,cm)
{
	var close_points_dist = 0.05,
		intersect_tor = -0.35,
		hook_tor = 0.1,
		dot_tor = 0.2;
	var visualize = true && drawer;
	
	var lm = component.length_function(cm);
	
	var info=
	{
		path:cm,
		joins:[false,false],
		hooks:[false,false],
		intersects:[],
		is_dot:false,
		bound:shape_bounds(cm,true)
	};
	
	//is dot
	if( (cm.length==2||cm.length==3) && cm.path_length < dot_tor)
	{
		info.is_dot = true;
		//if( visualize) subplotshape(drawer,bound,cm,{style:'point:3'});
	}
	
	//find close endpoints
	for( var i=0; i<comps.length; i++)
	{
		var cmb = comps[i];
		if( cm==cmb)
			continue;
		for( var j=0; j>=0; j=(j==0?cm.length-1:-1))
		for( var k=0; k>=0; k=(k==0?cmb.length-1:-1))
		{
			var p = cm[j],
				pb = cmb[k];
			if( distance(p,pb) < close_points_dist)
			{
				//if( visualize) subplotshape(drawer,bound,[p,pb],{style:'line:2'});
				info.joins[j==0?0:1] = true;
			}
		}
	}
	
	//find intersections
	for( var i=0; i<comps.length; i++)
	{
		var cmb = comps[i],
			lmb = component.length_function(cmb),
			global_t = component.global_t;
		if( cm==cmb)
			continue;
		for( var j=0; j<cm.length-1; j++)
		for( var k=0; k<cmb.length-1; k++)
		{
			var res = intersect(cm[j],cm[j+1],cmb[k],cmb[k+1]);
			var tor = intersect_tor;
			var inb = (k==0?tor:0)<res.b && res.b<(k==cmb.length-2?1-tor:1);
			if( info.is_dot) tor *= 2;
			var ina = (j==0?tor:0)<res.a && res.a<(j==cm.length-2?1-tor:1);
			if( ina && inb)
			{
				if( visualize) subplotshape(drawer,bound,[res],{stroke_width:0.6,style:'point:1'});
				var ag = qdiff(angle(cm[j],cm[j+1]),angle(cmb[k],cmb[k+1]));
				info.intersects.push({a:global_t(lm,j,res.a),b:global_t(lmb,k,res.b),x:res.x,y:res.y,ag:ag,i:i});
			}
		}
	}
	
	//determine hooks
	if( cm.length > 2)
	{
		var las = cm.length-1;
		if( distance(cm[0],cm[1])/cm.path_length < hook_tor)
		{
			info.hooks[0] = true;
			//if( visualize) subplotshape(drawer,bound,[cm[0]],{style:'point:3'}); 
		}
		if( distance(cm[las-1],cm[las])/cm.path_length < hook_tor)
		{
			info.hooks[1] = true;
			//if( visualize) subplotshape(drawer,bound,[cm[las]],{style:'point:3'});
		}
	}
	
	return info;
	
	function qdiff(a,b)
	{
		var ag = adiff(a,b); //0~PI angle difference
		if( ag > Math.PI/2)
			ag = Math.PI-ag; //0~PI/2 angle difference
		return ag;
	}
}
function analyse_dot_component(drawer,bound,infos,im,cutoff0,cutoff1)
{
	var visualize = true && drawer;
	cutoff0 = cutoff0 || 0.8;
	cutoff1 = cutoff1 || 0.1;
	if( im.intersects.length>0)
		return im;
	var cm = im.path,
		other_dots = all_other_dots(),
		others = [];
	im.other_dots = [];
	for( var i=0; i<other_dots.length; i++)
		others[i] = {
			vec: V.sub(center(other_dots[i]),center(cm)),
			dot: other_dots[i]
		};
	others.sort(function (a,b){return V.length(a.vec)-V.length(b.vec);});
	for( var i=0; i<others.length; i++)
	{
		var vec = others[i].vec;
		if( (im.other_dots.length>0 && V.length(vec)>cutoff1) ||
			(V.length(vec)>cutoff0) )
			break;
		im.other_dots.push(vec);
		if( visualize) subplotshape(drawer,bound,[center(others[i].dot),center(cm)],{style:'line:3'});
	}
	if( !im.other_dots.length)
	{
		var intest = find_intersects(),
			closest = select_best(intest,function(a,b){
				return Math.abs(a.b-0.5)<Math.abs(b.b-0.5);
			});
		if( visualize) subplotshape(drawer,bound,[center(cm),closest],{style:'line:2'});
		if( closest)
			im.intersects.push(closest);
	}
	return im;
	
	function all_other_dots()
	{
		var res = [];
		for( var i=0; i<infos.length; i++)
		{
			if( infos[i]==im)
				continue;
			if( infos[i].is_dot)
				res.push(infos[i].path);
		}
		return res;
	}
	function find_intersects()
	{
		var int = [];
		var lm = component.length_function(cm);
		//find intersections
		for( var i=0; i<infos.length; i++)
		{
			var cmb = infos[i].path,
				lmb = component.length_function(cmb),
				global_t = component.global_t;
			if( cm==cmb)
				continue;
			for( var j=0; j<cm.length-1; j++)
			for( var k=0; k<cmb.length-1; k++)
			{
				var res = intersect(cm[j],cm[j+1],cmb[k],cmb[k+1]);
				var tor = -0.1;
				var ina = true;
				var inb = (k==0?tor:0)<res.b && res.b<(k==cmb.length-2?1-tor:1);
				if( ina && inb)
				{
					var ag = qdiff(angle(cm[j],cm[j+1]),angle(cmb[k],cmb[k+1]));
					int.push({a:global_t(lm,j,res.a),b:global_t(lmb,k,res.b),x:res.x,y:res.y,ag:ag,i:i});
				}
			}
		}
		return int;
	}
	function center(im)
	{
		return V.midpoint(im[0],im[1]);
	}
	function qdiff(a,b)
	{
		var ag = adiff(a,b); //0~PI angle difference
		if( ag > Math.PI/2)
			ag = Math.PI-ag; //0~PI/2 angle difference
		return ag;
	}
}
var component=
{
	length_function: function(sp)
	{
		var L = 0,
			ll = [L];
		for( var i=1; i<sp.length; i++)
		{
			L += distance(sp[i],sp[i-1]);
			ll[i] = L;
		}
		for( var i=1; i<ll.length; i++)
			ll[i] /= L; //normalize
		return ll;
	},
	global_t: function(ll,j,local_t)
	{
		return local_t*(ll[j+1]-ll[j])+ll[j];
	}
};
function visualize_compgroup(drawer,bound,num,group)
{
	for( var i=0; i<group.length; i++)
	{
		var path;
		if( group[i].comp)
			path = group[i].comp.path;
		else
			path = group[i].path;
		subplotshape(drawer,bound,path,{style:'line:4',closepath:false,num:num});
	}
}
function visualize_component(drawer,bound,num,info,text)
{
	subplotshape(drawer,bound,info.path,{title:text,style:'line:0',closepath:false,num:num});
	subplotshape(drawer,bound,info.intersects,{style:'point:1',num:num});
	//if( info.is_dot)
		//subplotshape(drawer,bound,info.path,{style:'point:3',num:num});
	if( info.other_dots)
	{
		var dot = V.midpoint(info.path[0],info.path[1]);
		for( var i=0; i<info.other_dots.length; i++)
			subplotshape(drawer,bound,[dot,V.add(dot,info.other_dots[i])],{style:'line:3',num:num});
	}
}
function resize_component(stroke,stroke_path,ratio)
{
	var collec = [stroke,stroke_path];
	for( var i=0; i<collec.length; i++)
	{
		var path = collec[i];
		for( var j=0; j<path.length; j++)
		{
			path[j].x *= ratio;
			path[j].y *= ratio;
		}
	}
}

function component_similarity(im,imb) //components info
{
	var cm = im.path,
		cmb = imb.path,
		st = transform(cm,true,true),
		stb = transform(cmb,true,true);
	var comp_err,
		int_err,
		dot_err,
		size_err=0,
		aspect_err=0;
	var info = '';
	
	comp_err = component_correspondence('cost',null,null,0,null,null,cm,cmb); //component path error
	int_err = match_and_compute_error(im.intersects,imb.intersects,2,2, //intersects error
		function (A,B)
		{
			var err = 5*abs(A.a-B.a)*int_weight(A.a)
					 + abs(A.b-B.b)*int_weight(A.b)
					 + adiff(A.ag,B.ag);
			return err;
		});
	dot_err = match_and_compute_error(im.other_dots||[],imb.other_dots||[],4,2,
		function (A,B)
		{
			var err = 10*adiff(V.angle(A),V.angle(B))
					+ abs(V.length(A)-V.length(B));
			return err;
		});
	//Math.sqrt(square(im.bound.centerx-imb.bound.centerx)+square(im.bound.centery-imb.bound.centery)) //position
	if( cm.length>2 || cmb.length>2)
	{
		aspect_err = abs((imb.bound.width/imb.bound.height)-(im.bound.width/im.bound.height)); //aspect ratio
		size_err = abs((imb.bound.width*imb.bound.height)-(im.bound.width*im.bound.height)); //area
	}
	
	return {
		scores: [comp_err,int_err,dot_err,aspect_err,size_err],
		info: ''
	}
	
	function match_and_compute_error(A,B,mismatchA_err,mismatchB_err,cost_fun)
	{
		if( A.length && B.length)
		{
			var cost_matrix = generate_cost_matrix(A,B,cost_fun),
				assign = hungarian(cost_matrix,true),
				corr = pair_from_assignment_matrix(A,B,assign),
				corr_err = assignment_cost(cost_matrix,corr),
				mismatchA = abs(corr.length-A.length),
				mismatchB = abs(corr.length-B.length);
			return corr_err
				+ mismatchA*mismatchA_err
				+ mismatchB*mismatchB_err;
		}
		else
			return abs(A.length-B.length)*(mismatchA_err+mismatchB_err);
	}
	function int_weight(x)
	{
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
		// (1/(0.5*sqrt(2*pi))*exp(-(x-0.5)^2/(2*(0.5)^2)))
		var ww = (1/(0.5*sqrt(2*pi))*exp(-sq(x-0.5)/(2*sq(0.5))));
		ww *= 1.25;
		ww += 0.2; //additional offset
		return ww;
	}
	function abs(x)
	{
		return x>0?x:-x;
	}
	function square(x)
	{
		return x*x;
	}
	function square_sum(arr)
	{
		var res = 0;
		for( var i=0; i<arr.length; i++)
			res += arr[i]*arr[i];
		return Math.sqrt(res);
	}
	function divide_set(arr,de)
	{
		if( de===0)
			return arr;
		var res = [];
		for( var i=0; i<arr.length; i++)
			res[i] = Math.round(arr[i]/de*100)/100;
		return res;
	}
}

/*to make the stroke follow chinese writing convention
	i.e. strokes must start rightward or downward
             | / 
      bad ___|/__ good
            /|\   quadrant
           / | \  
           better
           quadrant
*/
function reverse_component_sense(path,ske,comp)
{
	path.reverse();
	ske.reverse();
	comp.reverse();
	for( var i=0; i<comp.length; i++)
		comp[i].i = path.length-1-comp[i].i;
}
function chinese_stroke_sense(path,ske,comp)
{
	var ag1 = angle(comp[0],comp[1]),
		ag2 = angle(comp[comp.length-1],comp[comp.length-2]),
		good = is_good(ag1),
		reverse_good = is_good(ag2);
	if( reverse_good > good)
	{
		reverse_component_sense(path,ske,comp);
		return true;
	}
	
	function is_good(ag)
	{
		var alw = Math.PI/15;
		if( -Math.PI/2<ag && ag<=-Math.PI/4)
			return 5;
		else if( -Math.PI*3/4+alw<ag && ag<=-Math.PI/2)
			return 4;
		else if( -Math.PI*3/4-alw<ag && ag<-Math.PI/4)
			return 3; //downward is better
		else if( -Math.PI/4<ag && ag<Math.PI/4-alw)
			return 2; //rightward is also good
		else if( -Math.PI<ag && ag<-Math.PI*3/4)
			return 1; //better than not
		else
			return 0; //bad
	}
}
/*\
 * math.intersect
 * line-line intersection
 [ method ]
 - P1 (object) point on line 1
 - P2 (object) point on line 1
 - P3 (object) point on line 2
 - P4 (object) point on line 2
 = (object) return the intersection point of P1-P2 with P3-P4
 * reference: [http://paulbourke.net/geometry/lineline2d/](http://paulbourke.net/geometry/lineline2d/)
\*/
function intersect(P1,P2,P3,P4)
{
	var mua,mub;
	var denom,numera,numerb;

	denom  = (P4.y-P3.y) * (P2.x-P1.x) - (P4.x-P3.x) * (P2.y-P1.y);
	numera = (P4.x-P3.x) * (P1.y-P3.y) - (P4.y-P3.y) * (P1.x-P3.x);
	numerb = (P2.x-P1.x) * (P1.y-P3.y) - (P2.y-P1.y) * (P1.x-P3.x);

	if ( negligible(numera) && negligible(numerb) && negligible(denom)) {
		//meaning the lines coincide
		return { type:'coincide'};
	}

	if ( negligible(denom)) {
		//meaning lines are parallel
		return { type:'parallel'};
	}

	mua = numera / denom;
	mub = numerb / denom;

	var out1 = mua < 0 || mua > 1;
	var out2 = mub < 0 || mub > 1;
	var type;

	if ( out1 & out2) {
		type='outside:both'; //the intersection lies outside both segments
	} else if ( out1) {
		type='outside:1'; //the intersection lies outside segment 1
	} else if ( out2) {
		type='outside:2'; //the intersection lies outside segment 2
	} else {
		type='inside:both';
	}

	return {
		type: type,
		a: mua,
		b: mub,
		x: P1.x + mua * (P2.x - P1.x),
		y: P1.y + mua * (P2.y - P1.y)
	}

	function negligible (M)
	{
		return -0.00000001 < M && M < 0.00000001;
	}
}
