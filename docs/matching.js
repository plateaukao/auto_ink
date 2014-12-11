function library_matching(group)
{
	var paths = group.paths,
		matches = group.matches||[],
		details = group.details||[],
		smooths = group.smooths||[],
		drawer = group.drawer,
		mode = group.mode,
		process_to_stage = group.process_to_stage,
		naive_style = group.naive_style,
		similarity_weight = group.similarity_weight,
		library = group.library,
		xxxxx;
	
	var bound = {
			centerx:0.5, centery:0.5,
			width:1, height:1
		},
		stroke_library=[],
		naive_style = false;
	
	//prepare library
	for( var i=0; i<library.length; i++)
	for( var j=0; j<library[i].length; j++)
	{
		stroke_library.push(library[i][j]);
		library[i][j].group = i;
	}
	if( stroke_library.length===1)
		naive_style = true;
	
	if( process_to_stage===0)
	{
		if( !drawer)
		{
			viewer_group();
			drawer = viewer_box('viewerbox');
		}
		for( var i=0; i<paths.length; i++)
			subplotshape(drawer,bound,paths[i],{closepath:false}).attr({'stroke-width':1});
	}
	
	if( process_to_stage<1) return;
	
	if( !drawer)
	{
		if( process_to_stage===1)
		{
			drawer = [];
			var column = [];
			for( var i=0; i<paths.length; i++)
			{
				column[i] = viewer_group();
				drawer[i] = viewer_box('viewercolumn',null,110,110);
				
				if( mode==='present')
					drawer[i].stroke_width = 2;
			}
		}
	}
	
	var comp = [],
		info = [],
		best = [];
	for( var i=0; i<paths.length; i++)
	{
		if( mode==='cartoon')
			comp[i] = prepare_component(paths[i],1.5,1.5);
		else
			comp[i] = prepare_component(paths[i]);
	}
	
	//component analysis
	for( var i=0; i<comp.length; i++)
	{
		if( process_to_stage===1) var draw = drawer[i];
		info[i] = analyse_component(draw,bound,comp,comp[i]);
	}
	for( var i=0; i<comp.length; i++)
	{
		if( process_to_stage===1) var draw = drawer[i];
		if( info[i].is_dot)
			info[i] = analyse_dot_component(draw,bound,info,info[i]);
	}
	
	//search in library
	for( var i=0; i<info.length; i++)
	{
		if( process_to_stage===1)
		{
			visualize_compgroup(drawer[i],bound,0,info);
			visualize_component(drawer[i],bound,0,info[i]);
			//subplotshape(drawer[i],bound,comp[i],{style:'line:0',closepath:false});
		}
		if( naive_style)
		{
			best[i] = [{
					score: 0,
					info: 'naive',
					profile: stroke_library[0]
				}];
		}
		else if( matches[i])
		{
			best[i] = [{
					score: 0,
					info: 'pre-matched',
					profile: stroke_library[matches[i]]
				}];
		}
		else
		{
			var cand = [];
			for( var j=0; j<stroke_library.length; j++)
			{
				var cms = component_similarity(info[i],stroke_library[j].comp);
				//component_correspondence('cost',drawer[i],bound,j+1,null,null,info[i].path,library[j].comp.path)
				cand[j] = cms;
				var weighted_scores = multiply_set(cms.scores,similarity_weight);
				cms.score = sum(weighted_scores);
				cms.info = JSON.stringify(weighted_scores)+'='+cms.score;
				cms.profile = stroke_library[j];
				//cms.j = j;
			}
			cand.sort(function(a,b) {return a.score-b.score;});
			best[i] = cand.slice(0,3);
			//console.log(best[i][0].j);
		}
	}
	//node linking
	if( mode==='chin_cali')
		node_linking();
	function node_linking()
	{
		for( var i=0; i<best.length; i++)
		{
			for( var k=0; k<info[i].intersects.length; k++) //for each of my friends
			{
				var me = best[i], //my bests list
					fr = best[info[i].intersects[k].i]; //friend's best list
				for( var x=0; x<me.length; x++)
				for( var y=0; y<fr.length; y++)
				{
					if( linked_to(me[x].profile,fr[y].profile))
					{
						//we share the linked candidates!
						me[x].score -= 30 * (1-y/fr.length); //promotion
					}
				}
			}
		}
	}
	function linked_to(A,B)
	{
		if( A.group!=B.group)
			return false;
		
		var AI = A.comp.intersects;
		for( var i=0; i<AI.length; i++)
		{
			var linked = library[A.group][AI[i].i];
			if( linked==B)
			{
				return true;
			}
		}
	}
	for( var i=0; i<best.length; i++)
		best[i].sort(function(a,b) {return a.score-b.score;}); //update ranking
	//visualize
	if( process_to_stage===1)
	for( var i=0; i<best.length; i++)
	{
		for( var j=0; j<best[i].length; j++)
		{
			var score = Math.round(best[i][j].score),
				text = best[i][j].info;
			if( mode==='present')
				text = 'matched component';
			visualize_compgroup(drawer[i],bound,j+1,library[best[i][j].profile.group]);
			visualize_component(drawer[i],bound,j+1,best[i][j].profile.comp,text);
			if( mode==='present')
				break;
		}
	}
	
	if( process_to_stage<2) return;
	
	if( !drawer || !drawer[0])
	{
		viewer_group();
		drawer = [];
		drawer[0] = viewer_box(mode==='cartoon'?'viewerboxbig':'viewerbox');
		if( mode==='present')
		drawer[1] = viewer_box('viewercolumn',null,110,110);
	}
	
	for( var i=0; i<best.length; i++)
	{
		transfer_stroke(drawer,i,best[i][0].profile,paths[i],
			{
				details:details,
				smooths:smooths,
				naive_style:naive_style,
				pretty_render:group.pretty_render,
				thickness:group.thickness
			});
	}
	
	//utilities
	function sum(arr)
	{
		var res = 0;
		for( var i=0; i<arr.length; i++)
			res += arr[i];
		return res;
	}
	function multiply_set(arr,coe)
	{
		var res = [];
		for( var i=0; i<arr.length; i++)
			res[i] = Math.round(arr[i]*coe[i]);
		return res;
	}
	function viewer_group()
	{
		var column = document.createElement('div');
		column.className = 'group';
		$('container').appendChild(column);
		current_group = column;
		return column;
	}
	function viewer_box(classname,id,width,height)
	{
		var div = document.createElement('div');
		div.className = classname;
		div.id = id;
		if( mode==='present' && classname==='viewercolumn')
			if( process_to_stage===1)
				div.style.height = '250px';
			else
				div.style.height = '2000px';
		current_group.appendChild(div);
		return new Drawer(div,width,height);
	}
}
function transfer_stroke(drawer,num,profile,path,options)
{
	var details = options.details,
		smooths = options.smooths,
		naive_style = options.naive_style,
		pretty_render = options.pretty_render;
	var visualize = true && drawer && drawer[1];
	var stroke = clone_array(profile.stroke),
		stroke_path = clone_array(profile.path);
	if( mode==='chin_cali' || mode==='present')
	{
		stroke = agdist_lower_sample(stroke,null,null,0.2,true,20);
		stroke_path = agdist_lower_sample(stroke_path,null,null,0.8,true,50);
	}
	else if( mode==='test2')
	{
		stroke = agdist_lower_sample(stroke,null,null,1,true,20);
	}
	var stroke_comp = prepare_component(stroke_path,2);
	comp = prepare_component(path,details[num]||2,smooths[num]||1);
	
	var re = {
			centerx:0.5, centery:0.5,
			width:1, height:1
		},
		size = Math.max(re.width,re.height)+0.1, //dynamic fit
		graph =
		{
			xrange:size, yrange:size,
			xoffset:size/2-(re?re.centerx:0), yoffset:size/2-(re?re.centery:0),
			width:100, height:100,
			num:0
		};
	
	var ratio = total_path_length(path)/total_path_length(stroke_path);
	if( naive_style)
	{
		if( mode==='chin_cali')
			ratio*=3;
		else if( mode==='cartoon')
			ratio = Math.pow(ratio,1/2)*0.2;
		ratio *= options.thickness||1;
		if( ratio < 1)
			resize_component(stroke,stroke_path,ratio);
	}
	else if( mode==='cartoon')
	{
		ratio = Math.pow(ratio,0.25);
		resize_component(stroke,stroke_path,ratio);
	}
	else if( mode==='chin_cali' || mode==='present')
	{
		if( structural_scheme==='final')
		{
			if( ratio <= 1)
				resize_component(stroke,stroke_path,ratio);
		}
		else if( structural_scheme==='demo')
		{
			ratio = Math.pow(ratio,0.25);
			ratio *= options.thickness||1;
			resize_component(stroke,stroke_path,ratio);
		}
	}
	
	var corr_path = component_correspondence('resample',visualize && drawer[1],re,2*num,stroke_path,path,stroke_comp,comp);
	if(!corr_path) return;
	if( corr_path.length < stroke_path.length) return;
	
	re.data = stroke;
	var ske = skeletonize(null,re,stroke_path);
	
	var deform = skeletal_deform(null,re,stroke_path,ske,corr_path);
	if( !deform)
	{
		console.log(deform);
		return;
	}
	
	if( visualize)
	{
		graph.num = 2*num+1;
		draw_skeleton(drawer[1],stroke,stroke_path,ske,graph);
		subplotshape(drawer[1],re,stroke,{num:2*num+1});
		draw_skeleton(drawer[1],deform,corr_path,ske,graph);
	}
	compact(deform);
	contract(deform,1/80);
	if( drawer)
	{
		if( pretty_render)
			subplotshape(drawer[0],re,deform,{style:'fill:0'});
		else
			subplotshape(drawer[0],re,deform,{style:'line:0'});
	}
	if( visualize)
		subplotshape(drawer[1],re,deform,{num:2*num+1});
	return {
		stroke:stroke,
		stroke_path:stroke_path,
		ske:ske,
		corr_path:corr_path,
		deform:deform
	};
	
	function total_path_length(sp)
	{
		var L = 0;
		for( var i=1; i<sp.length; i++)
			L += distance(sp[i],sp[i-1]);
		return L;
	}
	function compact(sp)
	{
		for( var i=0; i<sp.length; i++)
			if( !sp[i])
			{
				sp.splice(i,1);
				i--;
			}
	}
	function contract(sp,thres)
	{
		for( var i=0; i<sp.length-1; i++)
		{
			if( distance(sp[i],sp[i+1]) < thres)
			{
				var mid = V.midpoint(sp[i],sp[i+1]);
				sp.splice(i,1);
				sp[i].x = mid.x;
				sp[i].y = mid.y;
			}
		}
	}
}