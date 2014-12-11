function path_correspondence(drawer,bound,osa,osb)
{
	var spa = prepare_component(clone_array(osa)),
		spb = prepare_component(clone_array(osb));
	return component_correspondence('resample',drawer,bound,0,osa,osb,spa,spb);
}
function path_correspondence_naive(drawer,bound,osa,osb)
{
	return component_correspondence('naive-resample',drawer,bound,1,osa,osb);
}
/** given two curves A,B (osa,osb) and their respective component representations (spa,spb),
	compute the component correspondence
	oper=='resample': return the resampled curve B that corresponds point-to-point to curve A
	oper=='cost': returns the correspondence error
	oper=='naive': naive point to point correspondence
	*/
function component_correspondence(oper,drawer,bound,num,osa,osb,spa,spb)
{
	var visualize = true && drawer,
		stroke_width = 0.5;
	if( spa && spb)
		var sta = transform(spa,true,true),
			stb = transform(spb,true,true);
	var use_hungarian = false;
	
	if( oper.indexOf('naive')!=-1 && osa.length==osb.length)
	{
		//do nothing
	}
	else if( spa.length==2 && spb.length==2)
	{
		var corr = [[0,0],[spa.length-1,spb.length-1]];
	}
	else
	{
		var IA = seq(0,spa.length),
			IB = seq(0,spb.length);
		var cost_matrix = generate_cost_matrix(IA,IB,cost_function);
		if( use_hungarian)
		{
			var assign = hungarian(cost_matrix,true);
			var corr = obj_pair_from_assignment_matrix(IA,IB,assign);
		}
		else
		{
			var corrA = linear_optimal_assignment(IA,IB,cost_function),
				corrB = linear_optimal_assignment(IB,IA,function(i,j){return cost_function(j,i)});
			swap_pairs(corrB);
			//render_corr(drawer,1,num+0,corrA,spa,spb);
			//render_corr(drawer,3,num+0,corrB,spa,spb);
			var corr = common_pairs(corrA,corrB);
		}
	}
	function cost_function(i,j)
	{
		var ro = Math.round,
			a = Math.abs;
		var cost = 0;
		//cost += ro(50*a((i/spa.length)-(j/spb.length)));
		cost += ro(50*a(length_at(sta,i)-length_at(stb,j)));
		//if( i<spa.length-1 && j<spb.length-1)
			//cost += ro(50*a(distance(spa[i],spa[i+1])-distance(spb[j],spb[j+1])));
		
		if( typeof cartoon_scheme==='undefined')
		{
			if( i>0 && j>0)
				cost += ro(10*adiff(sta[i-1].q,stb[j-1].q));
			if( i<sta.length && j<stb.length)
			{
				cost += ro(10*adiff(sta[i].q,stb[j].q));
				if( i>0 && j>0)
					cost += ro(10*adiff(agdiff(sta[i-1].q,sta[i].q),agdiff(stb[j-1].q,stb[j].q)));
			}
		}
		else
		{
			if( i>0 && j>0)
				cost += ro(4*adiff(sta[i-1].q,stb[j-1].q));
			if( i<sta.length && j<stb.length)
			{
				cost += ro(4*adiff(sta[i].q,stb[j].q));
				if( i>0 && j>0)
					cost += ro(10*adiff(agdiff(sta[i-1].q,sta[i].q),agdiff(stb[j-1].q,stb[j].q)));
			}
		}
		return cost;
	}
	if( corr)
	{
		fix_tail(corr);
		remove_twist(corr);
		remove_outlier(corr);
	}
	
	if(visualize) if(spa) subplotshape(drawer,bound,spa,{style:'line:1',stroke_width:stroke_width,closepath:false,num:num});
	if(visualize) if(spb) subplotshape(drawer,bound,spb,{style:'line:2',stroke_width:stroke_width,closepath:false,num:num});
	if(visualize) if(corr) render_corr(drawer,3,num+0,corr,spa,spb);
	
	function self_corr(spa,osa)
	{
		translate(spa,{x:0.5,y:0.1});
		if(visualize) subplotshape(drawer,bound,osa,{style:'line:0',stroke_width:stroke_width,closepath:false,num:num+1});
		if(visualize) subplotshape(drawer,bound,spa,{style:'line:3',stroke_width:stroke_width,closepath:false,num:num+1});
		var scorr = [];
		for( var i=0; i<spa.length; i++)
		{
			scorr[i] = [i,spa[i].i];
		}
		render_corr(drawer,3,num+1,scorr,spa,osa);
	}
	//self_corr(spa,osa);
	//self_corr(spb,osb);
	
	var result = {};
	if( oper.indexOf('resample')!=-1)
	{
		var nsb = [];
		if( oper.indexOf('naive')!=-1 && osa.length==osb.length)
		{
			nsb = osb;
		}
		else
		{
			for( var i=0; i<corr.length-1; i++)
			{
				var a1 = spa[corr[i][0]].i,
					a2 = spa[corr[i+1][0]].i,
					b1 = spb[corr[i][1]].i,
					b2 = spb[corr[i+1][1]].i;
				if( i===0)
				{
					a1 = 0;
					b1 = 0;
				}
				if( i===corr.length-2)
					a2 = osa.length-1;
				var sam = a2-a1;
				if( sam<0)
				{
					console.log('component_correspondence: fail');
					return;
				}
				if( b2-b1<2)
				{
					//console.log('component_correspondence: point corr');
					b2+=1;
					sam+=1;
				}
				var seg = osb.slice(b1,b2);
				var use_double_sample = true;
				if( use_double_sample)
				{
					if( seg.length<2)
					{
						console.log('component_correspondence: point component');
						return;
					}
					for(var ttt=0; ttt<8 && seg.length<sam; ttt++)
						seg = double_sample(seg);
					if( ttt==8)
					{
						console.log('component_correspondence: resampling: trapped', sam);
						return;
					}
				}
				else
				{
					seg = poly_super_sample(seg,path_length_of(seg)/(sam)*0.5);
				}
				//subplotshape(drawer,bound,[osa[a1],osb[b1]],{style:'line:0',label:[a1,b1],num:num+1});
				seg = num_lower_sample(seg,null,null,sam);
				nsb = nsb.concat(seg);
			}
			nsb.push(osb[b2]);
			remove_duplicate(nsb);
			if( !nsb.length)
				console.log('component_correspondence: nsb failed');
			nsb = num_lower_sample(nsb,null,null,osa.length);
		}
		if( nsb.length!=osa.length)
			console.log('component_correspondence: mismatch: ',osa.length,nsb.length);
		if(visualize)
		{
			subplotshape(drawer,bound,osa,{style:'line:1',title:oper,stroke_width:stroke_width,closepath:false,num:num+1});
			subplotshape(drawer,bound,nsb,{style:'line:2',stroke_width:stroke_width,closepath:false,num:num+1});
			render_corr(drawer,3,num+1,stupid_corr(Math.min(osa.length,nsb.length)),osa,nsb);
		}
		if( oper=='resample' || oper=='naive-resample')
			return nsb;
		else
			result.path=nsb;
	}
	if( oper.indexOf('cost')!=-1)
	{
		var total_cost;
		if( spa.length==2 && spb.length==2)
		{
			var ww = 10;
			if( structural_scheme==='final')
				ww = 20;
			total_cost = Math.round(ww*adiff(sta[0].q,stb[0].q));
			var La = distance(spa[0],spa[1]),
				Lb = distance(spb[0],spb[1]);
			total_cost += 40*Math.abs(La-Lb);
		}
		else
		{
			total_cost = assignment_cost(cost_matrix,corr); //index, st, dst error
			for( var i=0; i<corr.length-1; i++)
			{
				var a1 = corr[i][0],
					a2 = corr[i+1][0],
					b1 = corr[i][1],
					b2 = corr[i+1][1],
					La = length_between(spa,a1,a2),
					Lb = length_between(spb,b1,b2);
				total_cost += 60*Math.abs(La-Lb); //length error
			}
		}
		var a1 = corr[0][0],
			a2 = corr[corr.length-1][0],
			b1 = corr[0][1],
			b2 = corr[corr.length-1][1],
			La = length_at(sta,a2)-length_at(sta,a1), //coverage percentage
			Lb = length_at(stb,b2)-length_at(stb,b1);
		total_cost += Math.round(60*((1-La)+(1-Lb))); //coverage error
		if( typeof cartoon_scheme!=='undefined')
			total_cost += Math.round(120*Math.abs(La-Lb));
		//
		var mismatch = Math.abs(corr.length-spa.length); //mismatch error
		total_cost += mismatch*40;
		//
		if( oper=='cost')
			return total_cost;
		else
			result.cost=total_cost;
	}
	if( oper.indexOf('corr')!=-1)
	{
		if( oper=='corr')
			return corr;
		else
			result.corr=corr;
	}
	return result;
	
	/*var corr = correspondence_1(rea.data,reb.data);
	var corr = correspondence_2(drawer,rea.data,reb.data,corr);
	var corr = stupid_corr(rea.data.length);
	*/
	
	function translate(sp,T)
	{
		for( var i=0; i<sp.length; i++)
		{
			sp[i].x+=T.x;
			sp[i].y+=T.y;
		}
	}
	function seq(a,b)
	{
		var res = [];
		for( var i=a; i<b; i++)
			res.push(i);
		return res;
	}
	function double_seq(a,b)
	{
		var res = [];
		for( var i=a; i<b; i++)
			res.push(i,i);
		return res;
	}
	function linear_optimal_assignment(IA,IB,cost_fun)
	{
		var corr = [];
		for( var i=0; i<IA.length; i++)
		{
			var cost_array = [];
			for( var j=0; j<IB.length; j++)
				cost_array[j] = cost_fun(i,j);
			var j = select_best(IB,function(x,y) {
				return cost_array[x] < cost_array[y];
			});
			corr.push([i,j]);
		}
		return corr;
	}
	function render_corr(drawer,color,num,corr,spa,spb)
	{
		var seg = [];
		for( var i=0; i<corr.length; i++)
		{
			if( spa[corr[i][0]] && spb[corr[i][1]])
			{
				seg.push(spa[corr[i][0]]);
				seg.push(spb[corr[i][1]]);
			}
		}
		if(visualize) subplotshape(drawer,bound,seg,{style:'segment:'+color,stroke_width:0.2,num:num});
	}
	function swap_pairs(pairs)
	{
		for( var i=0; i<pairs.length; i++)
		{
			var t = pairs[i][0];
			pairs[i][0] = pairs[i][1];
			pairs[i][1] = t;
		}
	}
	function common_pairs(pairA,pairB)
	{
		var res = [];
		for( var i=0; i<pairA.length; i++)
		{
			var found=undefined;
			for( var j=0; j<pairB.length && found===undefined; j++)
			{
				if( pairA[i][0]===pairB[j][0] && 
					pairA[i][1]===pairB[j][1] )
					found = j;
			}
			if( found!==undefined)
				res.push(pairA[i]);
		}
		return res;
	}
	function fix_tail(pairs)
	{
		if( pairs[pairs.length-1][0]===spa.length-2)
			pairs[pairs.length-1][0] = spa.length-1;
	}
	function stupid_corr(len)
	{
		var res=[];
		for( var i=0; i<len; i++)
		{
			res[i] = [i,i];
		}
		return res;
	}
	function remove_twist(pairs)
	{
		for( var i=0; i<pairs.length-1; i++)
		{
			if( pairs[i][0]+1===pairs[i+1][0] &&
				pairs[i][1]  ===pairs[i+1][1]+1 )
			{
				pairs[i][1]-=1;
				pairs[i+1][1]+=1;
				//if(visualize) subplotshape(drawer,bound,[spa[pairs[i][0]],spb[pairs[i][1]]],{style:'line:1',num:num});
			}
		}
	}
	function remove_backport(pairs)
	{
		for( var i=1; i<pairs.length; i++)
		{
			if( pairs[i][0]<pairs[i-1][0] ||
				pairs[i][1]<pairs[i-1][1] )
			{
				pairs.splice(i,1);
				i--;
			}
		}
	}
	function remove_outlier(pairs)
	{
		//according to index
		var ave_dist = 0;
		for( var i=0; i<pairs.length; i++)
			ave_dist += Math.abs(pairs[i][0]-pairs[i][1]);
		ave_dist /= pairs.length;
		if( ave_dist<0.5) ave_dist=0.5;
		else if( ave_dist<1) ave_dist=1;
		for( var i=0; i<pairs.length; i++)
		{
			var dist = Math.abs(pairs[i][0]-pairs[i][1]);
			if( dist > ave_dist*2)
			{
				pairs.splice(i,1);
				i--;
			}
		}
		//according to distance
		/*var ave_dist = 0;
		for( var i=0; i<pairs.length; i++)
			ave_dist += distance(spa[pairs[i][0]],spb[pairs[i][1]]);
		ave_dist /= pairs.length;
		for( var i=0; i<pairs.length; i++)
		{
			var dist = distance(spa[pairs[i][0]],spb[pairs[i][1]]);
			if( dist > ave_dist*2)
			{
				pairs.splice(i,1);
				i--;
			}
		}*/
	}
	function remove_duplicate(sp,thres,silent) //remove consecutive duplicates
	{
		if(!thres) thres = 0.0001;
		for( var i=0; i<sp.length; i++)
		{
			if( !sp[i])
			{
				console.log('has undefined');
				sp.splice(i,1);
				i--;
			}
		}
		for( var i=0; i<sp.length-1; i++)
		{
			if( Math.abs(sp[i].x-sp[i+1].x) < thres && 
				Math.abs(sp[i].y-sp[i+1].y) < thres)
			{
				console.log('has duplicate');
				sp.splice(i,1);
				i--;
			}
		}
		return sp;
	}
	function double_sample(seg)
	{
		var res=[]
		for( var i=0; i<seg.length-1; i++)
			res.push(seg[i],{
				x:(seg[i].x+seg[i+1].x)/2,
				y:(seg[i].y+seg[i+1].y)/2
			});
		res.push(seg[seg.length-1]);
		return res;
	}
	function length_between(sp,a,b)
	{
		var len = 0;
		for( var i=a; i<b; i++)
			len+=distance(sp[a],sp[a+1]);
		return len;
	}
	function length_at(st,a)
	{
		if( a==st.length)
			return 1;
		else
			return st[a].l;
	}
}
function poly_super_sample(buffer,density)
{
	var pathlength = path_length_of(buffer);
	if( !density)
		density = pathlength/50;
	if( density>=pathlength)
		return buffer.slice(0);
	var points = [];
	for( var i=0; i<buffer.length-1; i++)
	{
		var steps = Math.round(distance(buffer[i],buffer[i+1])/density);
		if( steps > 100) {
			steps = 100;
			console.log('poly_super_sample: trapped');
		}
		for( var t=0; t<steps; t++)
		{
			points.push({
				x:buffer[i].x*(steps-t)/steps + buffer[i+1].x*t/steps,
				y:buffer[i].y*(steps-t)/steps + buffer[i+1].y*t/steps
			});
		}
	}
	if( buffer.length>1)
		points.push(buffer[buffer.length-1]);
	return points;
}
function path_interpolation(drawer,bound,title,num,spa,spb)
{
	var visualize = true && drawer;
	var steps = 10;
	subplotshape(drawer,bound,spa,{closepath:false,num:num,stroke_width:0.5,title:title||'path interpolation'});
	subplotshape(drawer,bound,spb,{closepath:false,stroke_width:0.5,num:num});
	for( var i=0; i<steps; i++)
	{
		var t = i/steps;
		var sp = [];
		for( var j=0; j<spa.length; j++)
		{
			sp[j] = V.add(V.scale(spa[j],t),V.scale(spb[j],1-t));
		}
		subplotshape(drawer,bound,sp,{closepath:false,stroke_width:0.2,num:num});
	}
}
function path_interpolation_raphael(drawer,bound,num,spa,spb)
{
	var visualize = true && drawer;
	var steps = 10;
	subplotshape(drawer,bound,spa,{closepath:false,num:num,title:'path_interpolation_raphael'}).attr({'stroke-width':0.5});
	subplotshape(drawer,bound,spb,{closepath:false,num:num}).attr({'stroke-width':0.5});
	for( var i=0; i<steps; i++)
	{
		var t = i/steps;
		var A = drawer.rl.path(construct_svgpathstring(spa)).attr({fill:'none',stroke:'#000','stroke-width':0.2});
		var toB = Raphael.animation({path:construct_svgpathstring(spb)},2000,'linear');
		A.status(toB,t);
		var sp = sample_path(A,40);
		subplotshape(drawer,bound,sp,{closepath:false,num:num}).attr({'stroke-width':0.2});
	}
}
function correspondence_1_does_not_work(CA,CB)
{
	var HA = curve_context(CA),
		HB = curve_context(CB);
	var cost = cost_matrix(HA,HB),
		asign = hungarian(cost,true);
	return correspondence_from_assignment_matrix(asign,CA.length,CB.length);
	
	function curve_context(C)
	{
		var ag_bins = 6, //number of angle bins
			ld_bins = 1; //number of distance bins
		
		var D = [];
		for( var i=0; i<C.length; i++)
			D[i] = context(i);
		return D;
		
		function context(I)
		{
			var DD = new Array(ag_bins*ld_bins);
			for( var i=0; i<DD.length; i++)
				DD[i] = 0;
			for( var i=0; i<C.length; i++)
			{
				if( i===I)
					continue;
				var ag = full_angle(C[I],C[i]),
					dist = distance(C[I],C[i]);
				put_into_bin(DD,ag,dist);
			}
			return DD;
		}
		function put_into_bin(DD,ag,dist)
		{
			var ld = square(1+dist*2*2),
				ld_range = square(1+2),
				ag_range = 2*Math.PI,
				ag_bin = Math.floor(ag/ag_range*ag_bins),
				ld_bin = Math.floor(ld/ld_range*ld_bins);
			DD[ag_bin*ld_bins+ld_bin]+=1;
		}
	}
	function cost_matrix(HA,HB)
	{
		var M = Array2D(HA.length,HB.length);
		for( var i=0; i<HA.length; i++)
			for( var j=0; j<HB.length; j++)
			{
				M[i][j] = chi_square(HA[i],HB[j]) + offset(i,j);
			}
		return M;
		function offset(i,j)
		{
			return 0.2*square(Math.abs(i-j));
		}
		function chi_square(D1,D2)
		{
			var sum=0;
			for( var k=0; k<D1.length; k++)
				if( D1[k]+D2[k] > 0)
					sum+= square(D1[k]-D2[k])/(D1[k]+D2[k]);
			return sum;
		}
	}
	function square(s)
	{
		return s*s;
	}
}
function correspondence_2_does_not_work(drawer,spa,spb,osign)
{
	var sta = transform(spa,true),
		stb = transform(spb,true),
		dsta = differentiate(sta,'q','l',true),
		dstb = differentiate(stb,'q','l',true),
		cost = cost_matrix(),
		asign = hungarian(cost,true);
	return remove_twist(correspondence_from_assignment_matrix(asign,spa.length,spb.length));
	
	function cost_matrix()
	{
		var cost = Array2D(spa.length,spb.length);
		cost[0][0] = -10;
		cost[spa.length-1][spb.length-1] = -10;
		for( var i=0; i<osign.length; i++)
		{
			var a=osign[i][0],
				b=osign[i][1];
			var scale = (curvy(a,b));
			for( var m=a+1; m<spa.length; m++)
			for( var n=0; n<b; n++)
				cost[m][n] += dist(m,n,a,b)*scale;
			for( var m=b+1; m<spb.length; m++)
			for( var n=0; n<a; n++)
				cost[n][m] += dist(n,m,a,b)*scale;
		}
		return cost;
	}
	function dist(m,n,a,b)
	{
		return ((m-a)*(m-a)+(n-b)*(n-b));
	}
	function curvy(i,j)
	{
		if( dsta[i] && dstb[j])
		if( dsta[i].dydx * dstb[j].dydx > Math.PI*0.2)
		{
			//subplotshape(drawer,shape_bounds(spa),[spa[i],spb[j]],{style:'segment:1',zoom:-0.2});
			return 10;
		}
		return 1;
	}
	function ave_curvature(dst,i)
	{
		var value=0, N=0;
		for( var j=i-1; j<i+1; j++)
		{
			if( 0<=j && j<dst.length)
			{
				value+=Math.abs(dst[j].dydx);
				N++;
			}
		}
		if( N!==0)
			return value/N;
		else
			return 0;
	}
}
function correspondence_from_assignment_matrix(C,al,bl)
{
	var corr=[];
	for( var i=0; i<C.length; i++)
	{
		for( var j=0; j<C[i].length; j++)
			if( C[i][j]===1 && //search for the 1
				i<al && j<bl)
			{
				corr.push([i,j]);
				break;
			}
	}
	return corr;
}
function ag_lower_sample(sp,st,dst,threshold,linear) //constant angle error lower sampling
{									//to produce minimum number of points
	if( !st)
		st = transform(sp);
	if( threshold===undefined || threshold===null)
		threshold = Math.PI*0.05;
	var res=[],
		last=0;
	res.push(sp[0]);
	for( var i=1; i<sp.length; i++)
	{
		var err=0; //accumulated angle error
		for( var j=last; j<i; j++)
			err+=adiff(st[j+1].q,st[j].q);
		if( err>threshold)
		{
			res.push(sp[i]);
			last=i;
		}
	}
	if( linear && last!=sp.length-1)
		res.push(sp[sp.length-1]);
	return res;
}
function dist_lower_sample(sp,st,dst,threshold,linear) //constant distance lower sampling
{
	if( threshold===undefined || threshold===null)
		threshold = 1/80;
	var res=[],
		last=0;
	res.push(sp[0]);
	for( var i=1; i<sp.length; i++)
	{
		var err=0; //accumulated angle error
		for( var j=last; j<i; j++)
			err+=distance(sp[i-1],sp[i]);
		if( err>threshold)
		{
			res.push(sp[i]);
			last=i;
		}
	}
	if( linear && last!=sp.length-1)
		res.push(sp[sp.length-1]);
	return res;
}
function agdist_lower_sample(sp,st,dst,threshold,linear,dist_weight) //constant angle and distance error lower sampling
{
	if( !st)
		st = transform(sp);
	if( threshold===undefined || threshold===null)
		threshold = 0.5;
	if( dist_weight===undefined || dist_weight===null)
		dist_weight = 5;
	var res=[],
		last=0;
	res.push(sp[0]);
	var tag=0,tdt=0,distw=dist_weight;
	for( var i=1; i<sp.length; i++)
	{
		var ag_err=0, //accumulated error
			dt_err=0;
		for( var j=last; j<i; j++)
		{
			ag_err+=adiff(st[j+1].q,st[j].q);
			dt_err+=distance(sp[j],sp[j+1]);
		}
		var err=ag_err+distw*dt_err;
		tag+=ag_err;tdt+=distw*dt_err;
		if( err>threshold)
		{
			res.push(sp[i]);
			last=i;
		}
	}
	//console.log(Math.round(tag*100),Math.round(tdt*100));
	if( linear && last!=sp.length-1)
		res.push(sp[sp.length-1]);
	return res;
}
function num_lower_sample(sp,st,dst,num) //lower sample to a definite number of points
{
	var debug = false;
	if( !st)
		st = transform(sp);
	if( !dst)
		dst = differentiate(st,'q','l');
	if( sp.length < num)
		return sp;
	var res;
	for( var i=0; i<dst.length; i++)
		dst[i].i = i;
	var rdst = lower(dst,num);
	res = remove_low_curvature(rdst,num);
	if( debug)
		console.log('lowered to '+res.length);
	return res;
	function lower(dst,num)
	{
		var res = [];
		var dropr = 1-num/dst.length,
			lastr = 0;
		for( var i=0; i<dst.length; i++)
			if( Math.floor(i*dropr)>=lastr+1)
			{
				if( Math.abs(dst[i].dydx) >= 0.5*Math.PI)
					res.push(dst[i]);
				else
					lastr++;
			}
			else
			{
				//if( Math.abs(dst[i].dydx) <= 0.0*Math.PI); else
				res.push(dst[i]);
			}
		return res;
	}
	function remove_low_curvature(dst,num)
	{
		var res=[];
		dst = dst.sort(function(a,b){return Math.abs(b.dydx)-Math.abs(a.dydx);}); //sort by descending curvature
		dst = dst.slice(0,num); //discard the insignificant points
		dst = dst.sort(function(a,b){return Math.abs(a.i)-Math.abs(b.i);}); //sort by ascending i
		for( var i=0; i<dst.length; i++)
			res.push(sp[dst[i].i]);
		return res;
	}
}