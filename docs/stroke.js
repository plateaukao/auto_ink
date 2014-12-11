function stroke_deformation(str,zoom)
{
	zoom = zoom || 0.01;
	var re = str.shape;
	var box = document.createElement('div');
	box.className = 'box';
	$('container2').appendChild(box);
	var drawer = new Drawer(box);
	var graph = get_subplot_graph_zoom(drawer,re,zoom);
	var naxis = clone_array(str.axis);
	var dragger = new Dragger(box,naxis,redraw,get_screen_transform_fun(graph));
	function redraw()
	{
		drawer.clear();
		var deform = skeletal_deform(drawer,re,str.axis,str.skeleton,naxis);
		subplotshape(drawer,re,deform,{zoom:zoom});
		draw_skeleton(drawer,deform,naxis,str.skeleton,graph);
		subplotshape(drawer,re,naxis,{closepath:false,style:'line:0',zoom:zoom});
	}
}
/*\
 * principal_axis
 - drawer (object) raphael drawer for visualization
 - re (object) reconstructed shape
 - st (array of {l,q}) contour angle shape transform
 - dst (array of {x,dydx}) dq/dl of st
\*/
function principal_axis(drawer,re,st,dst,thickness)
{
	if( re.length>2)
		return;
	var visualize = false && drawer;
	var outer_corner_tor = 0.95*Math.PI; //tolerances
	var sp = fn(function(re){return re.data},re);
	var midpoint = V.midpoint;
	var single = (re.length==1);
	var result;
	thickness = thickness || 1;
	if( single)
		result = principal_axis_single(re[0],st[0],dst[0]);
	else
		result = principal_axis_double(re,st,dst);
	if( result && (typeof structural_scheme!=='undefined' || typeof principal_axis_no_verify!=='undefined' || verify(result)))
	{
		result = remove_duplicate(result,null,true);
		if( visualize)
			subplotshape(drawer,re[0],result,{style:'line:0',closepath:false});
		return result;
	}
	else
	{
		if( visualize)
			subplotshape(drawer,re[0],result,{style:'line:0',closepath:false,title:'________________________non stroke'});
	}
	
	function principal_axis_single(re,st,dst)
	{
		var result = [];
		var sp = re.data;
		var AB = search_pair();
		if( !AB)
			return;
		var oa=AB.a, ob=AB.b;
		A_add(result,midpoint(O_get(sp,oa),O_get(sp,ob)),1);
		if( visualize)
			subplotshape(drawer,re,[O_get(sp,oa),O_get(sp,ob)],{style:'point:1',closepath:false});
		if( oa>ob)
		{
			var tempa = oa;
			oa = ob;
			ob = tempa;
		}
		var direc = [1,-1];
		for( var ddd in direc) //first forward, then backward
			for( var a=oa,b=ob, oA=oa,oB=ob, counter=0 ;;)
		{
			var dir = direc[ddd];
			//loop condition
			if( dir===1)
				if( !(a<b))
					break;
			if( dir===-1)
				if( !((a>=0&&b<sp.length) || (O_index(sp,b)<O_index(sp,a))))
					break;
			var A,B;
			var go_B = counter++%2===0;
			if( typeof structural_scheme!=='undefined')
				go_B = curvier(O_get(dst,a).dydx, O_get(dst,b).dydx);
			if( go_B)
			{
				A = a;
				B = pair_of(a,b,-dir);
				if( B!==undefined)
				{
					b = B+0;
					A = pair_of(B,A,dir);
					if( A!==a) a = A-0; else A=a;
				}
			}
			else
			{
				B = b;
				A = pair_of(b,a,dir);
				if( A!==undefined)
				{
					a = A-0;
					B = pair_of(A,B,-dir);
					if( B!==b) b = B+0; else B=b;
				}
			}
			if( A!==undefined && B!==undefined)
			{
				if( A===oA && B===oB)
					break;
				var P = intermediate(0,oA,A,0,oB,B,dir);
				oA=A; oB=B;
				//next point
				A_add(P,midpoint(O_get(sp,A),O_get(sp,B)),dir);
				if( visualize)
					subplotshape(drawer,re,[O_get(sp,A),O_get(sp,B)],{style:'line:3',closepath:false});
				if( dir===1)
					result = P.concat(result);
				if( dir===-1)
					result = result.concat(P);
			}
			//counter increment
			a+=dir;
			b-=dir;
		}
		return result;
		function search_pair()
		{
			var minI, minvalue;
			for( var i=0; i<sp.length; i+=Math.floor(sp.length/10))
			for( var j=1; j<Math.floor(sp.length*0.3); j++)
			{
				var agdiff = apara(O_get(st,i).q, O_get(st,i+j).q);
				if( agdiff)
				{
					var dist = distance(O_get(sp,i), O_get(sp,i+j)),
						value = dist*2+agdiff;
					var sumdst = 0;
					for( var k=i; k<i+j; k++)
						sumdst += O_get(dst,k).dydx;
					if( sumdst>0) //outward tip
					if( value<minvalue || minI===undefined)
					{
						minI = {a:i, b:i+j};
						minvalue = value;
					}
				}
			}
			return minI;
		}
		function pair_of(i,k,forward)
		{
			var minI, minvalue;
			for( var j=0; j<Math.floor(sp.length*0.15*thickness); j++)
			{
				var kj = k+j*forward;
				if( O_index(sp,i)===O_index(sp,kj))
					break;
				//if( check_intersects(i,k,kj))
					//break;
				if( !O_get(st,kj))
					console.log(st.length, kj);
				var agdiff1 = apara(O_get(st,i).q, O_get(st,kj).q,Math.PI*0.35), //angle diff. between i and kj
					ag = -angle(O_get(sp,i), O_get(sp,kj)), //angle of the cross section line
					agdiff2 = nonpara(ag,O_get(st,i).q), //angle diff between i and the cross section line
					agdiff3 = nonpara(ag,O_get(st,kj).q);//angle diff between kj and the cross section line
				if( agdiff1 && agdiff2 && agdiff3)
				{
					var dist = distance(O_get(sp,i), O_get(sp,kj)),
						value = dist*30+(j===0?2:0)+agdiff1-agdiff2-agdiff3;
						if( typeof cartoon_scheme!=='undefined')
							value = dist*5+(j===0?2:0)+agdiff1-2*agdiff2-2*agdiff3;
						if( typeof structural_scheme!=='undefined')
							if( j===0) value+=5;
						//value = dist*20+(j===0?1:0)*0.1+agdiff1;
					if( value<minvalue || minI===undefined)
					{
						minI = kj;
						minvalue = value;
					}
				}
			}
			return minI;
			function check_intersects(i,k,kj)
			{
				for( ;k<kj;k++)
				{
					if( intersecting(O_get(sp,i),O_get(sp,kj),O_get(sp,k),O_get(sp,k+1)))
						return true;
				}
			}
		}
	}
	function principal_axis_double(re,st,dst)
	{
		var result = [];
		var AB = search_pair();
		if( !AB)
			return;
		var oa=AB.a, ob=AB.b,
			spa = sp[0],
			spb = sp[1];
		result.push(midpoint(O_get(spa,oa),O_get(spb,ob)));
		for( var a=oa,b=ob, counter=0;;)
		{
			var holda=a, holdb=b;
			if( (counter++)%2===0)
			{
				var B = pair_of_2(0,a,1,b,-1);
				if( B!==undefined)
				{
					b = B;
					var A = pair_of_2(1,b,0,a,1);
					if( A!==undefined)
						a = A;
				}
			}
			else
			{
				var A = pair_of_2(1,b,0,a,1);
				if( A!==undefined)
				{
					a = A;
					var B = pair_of_2(0,a,1,b,-1);
					if( B!==undefined)
						b = B;
				}
			}
			if( holda==a && holdb==b)
			{
				console.log('stuck');
				break;
			}
			result = result.concat(intermediate(0,holda,a,1,holdb,b,-1));
			if( a>oa+spa.length || b<ob-spb.length)
				break;
			result.push(midpoint(O_get(spa,a),O_get(spb,b)));
			if( visualize)
				subplotshape(drawer,re[0],[O_get(spa,a),O_get(spb,b)],{style:'line:3',closepath:false});
		}
		if( visualize)
			subplotshape(drawer,re[0],[O_get(spa,oa),O_get(spb,ob)],{style:'line:1',closepath:false});
		return result;
		function search_pair()
		{
			var minI, minvalue;
			for( var i=0; i<sp[0].length; i+=Math.floor(sp[0].length/10))
			for( var j=0; j<sp[1].length; j+=Math.floor(sp[1].length/10))			
			{
				var agdiff = apara(O_get(st[0],i).q, O_get(st[1],j).q);
				if( agdiff)
				{
					var dist = distance(O_get(sp[0],i), O_get(sp[1],j)),
						value = dist*2+agdiff;
					if( value<minvalue || minI===undefined)
					{
						minI = {a:i, b:j};
						minvalue = value;
					}
				}
			}
			return minI;
		}
		function pair_of_2(si,i,sk,k,dir)
		{
			var minI, minvalue;
			for( var j=1; j<Math.floor(sp[sk].length*0.15); j++)
			{
				var kj = k+j*dir;
				/*var agdiff1 = apara(O_get(st[si],i).q, O_get(st[sk],kj).q, Math.PI*0.35), //angle diff. between i and kj
					ag = -angle(O_get(sp[si],i), O_get(sp[sk],kj)), //angle of the cross section line
					agdiff2 = nonpara(ag,O_get(st[si],i).q), //angle diff between i and the cross section line
					agdiff3 = nonpara(ag,O_get(st[sk],kj).q);//angle diff between kj and the cross section line
				if( agdiff1 && agdiff2 && agdiff3)
				{
					var dist = distance(O_get(sp[si],i), O_get(sp[sk],kj)),
						value = dist*30+(j===0?2:0)+agdiff1-agdiff2-agdiff3;
						//value = dist*20+(j===0?1:0)*0.1+agdiff1;
					if( value<minvalue || minI===undefined)
					{
						minI = kj;
						minvalue = value;
					}
				}*/
				var agdiff = apara(O_get(st[si],i).q, O_get(st[sk],kj).q, Math.PI*0.5);
				if( agdiff===undefined)
					agdiff = Math.PI/2;
				var dist = distance(O_get(sp[si],i), O_get(sp[sk],kj)),
					value = dist*10+agdiff;
				if( value<minvalue || minI===undefined)
				{
					minI = kj;
					minvalue = value;
				}
			}
			if( minI===undefined)
				var a;
			return minI;
		}
	}
	function intermediate(ia,oA,A,ib,oB,B,dir)
	{
		var P = [];
		var max_diff = 3; //max diff. between advancement of A and B
			diff = Math.abs(Math.abs(A-oA)-Math.abs(B-oB)),
			step = 0;
		if( diff>max_diff)
			step = 1/(Math.round(diff/max_diff)+1);
		if( Math.abs(A-oA)>4 || Math.abs(B-oB)>4)
			step = 1/(Math.round(Math.max(Math.abs(A-oA),Math.abs(B-oB))/max_diff)+1);
		if( step)
		{
			for( var ti=step; ti<1; ti+=step)
			{
				var na = O_get(sp[ia],Math.round(A*ti+oA*(1-ti))),
					nb = O_get(sp[ib],Math.round(B*ti+oB*(1-ti)));
				A_add(P,midpoint(na,nb),dir);
				if( visualize)
					subplotshape(drawer,re[0],[na,nb],{style:'line:3',closepath:false});
			}
		}
		return P;
	}
	function verify(ax)
	{
		var sp = re[0].data;
		var sp_sample_every = 1,
			ax_sample_every = 1,
			num_of_outpoints_tor = 0;
		var path = ''; //contour svg path string
		for( var i=0; i<sp.length; i+=sp_sample_every)
			path += ''+(i===0?'M':'L')+sp[i].x+','+sp[i].y;
		path += 'z';
		var outcc = 0;
		for( var i=0; i<ax.length; i+=ax_sample_every)
		{
			if( typeof structural_scheme!=='undefined')
			{
				if( i==0) continue;
				if( i==ax.length-1) continue;
			}
			if( !Raphael.isPointInsidePath(path, ax[i].x,ax[i].y)) //Raphael rocks!
			{
				outcc++;
				if( outcc > num_of_outpoints_tor)
					return false;
			}
		}
		return true;
	}
	function intersecting(p0,p1,p2,p3)
	{	//return true if line (p0,p1) intersects (p2,p3)
		return signed_area(p0,p1,p2)>0 == signed_area(p1,p2,p3)>0;
	}
	function curvier(A,B)
	{
		if( A>=0&&B>=0)
			return A>B;
		else if( A<0 && B<0)
			return A<B;
		else if( A>=0&&B<0)
			return A>-B;
		else if( A<0&&B>=0)
			return -A>B;
	}
	function A_add(A,P,dir)
	{
		if( dir===1)
			A.unshift(P);
		if( dir===-1)
			A.push(P);
	}
	function apara(A,B,apara_tor)
	{	//anti parallel
		if(!apara_tor)
			apara_tor = Math.PI*0.25;
		var ad = adiff(A,B);
		if( ad > Math.PI-apara_tor)
			return Math.PI-ad;
	}
	function nonpara(a,b)
	{
		var para_tor = Math.PI*0.2;
		var ad = adiff(a,b);
		if( ad > Math.PI-para_tor)
			return false;
		else if( ad < para_tor)
			return false;
		else
		{
			if( ad>Math.PI/2)
				return Math.PI-ad;
			else
				return ad;
		}
	}
	function O_index(A,i) //circular index
	{
		if( i>=0)
			return i%A.length;
		else
			return (A.length+i%A.length)%A.length;
	}
	function detect_tip()
	{
		corners = filter(dst,1,outercornerdetect);
		if( visualize)
			subplotshape(drawer,re,corners,{style:'point:3'});
	}
	function outercornerdetect(index,ww)
	{
		if( ww[0].dydx>=outer_corner_tor)
		{
			var P = sp[index];
			var Q = st[index];
			return { I:index, x:P.x, y:P.y, l:Q.l, q:Q.q };
		}
	}
}
/*\
 * skeletonize
 - drawer (object) raphael drawer for visualization
 - re (object) reconstructed shape
 - ax (array of points) principal axis
\*/
function skeletonize(drawer,re,ax)
{
	var visualize = false && drawer;
	var sp = re.data;
	var lasti = search_closest(0,0,ax.length);
	var sk=[];
	for( var i=0; i<ax.length; i++) //each point on the axis
		sk[i] = [];				// .. is an array of closest contour points' index on sp
	for( var i=0; i<sp.length; i++)
	{
		var p = search_closest(i,lasti,4);
		if( p!==undefined)
		{
			lasti = p;
			if( visualize)
				subplotshape(drawer,re,[ax[p],sp[i]],{style:'line:3',closepath:false});
			sk[p].push(i);
		}
	}
	return sk;
	function search_closest(pp,at,scope)
	{
		var minI, mind;
		var tang = angle(O_get(sp,pp),O_get(sp,pp+1)); //angle of tangent
		for( var i=-scope; i<scope; i++)
		{
			if( 0<=at+i && at+i<ax.length)
			{
				var dist = distance(sp[pp],ax[at+i]);
				var centri = angle(sp[pp],ax[at+i]); //angle toward center
				var ag = acdiff(centri,tang);
				if( 0 < ag && ag < Math.PI) //within half circle
				{
					if( dist<mind || mind===undefined)
					{
						minI = at+i;
						mind = dist;
					}
				}
			}
		}
		if( minI===undefined)
		{
			minI=at;
			console.log('skeletonize: undefined minI');
			if( visualize)
				subplotshape(drawer,re,[O_get(sp,pp)],{style:'point:1',closepath:false});
		}
		return minI;
	}
	function acdiff(a,b) //anti clockwise diff
	{
		var dy = agdiff(a,b);
		if( dy<0)
			dy = 2*Math.PI+dy;
		return dy;
	}
}
function skeletonize_ap(sp,sk,ax)
{
	var ap = [];
	for( var i=0; i<ax.length; i++)
	{
		ap[i] = [[],[]]; //each point on ax has two fans
				//.. and each fan is an array of point angles
		var aa,ab;
		if( 0<i)
			aa = angle(ax[i],ax[i-1]);
		if( i<ax.length-1)
			ab = angle(ax[i],ax[i+1]);
		var P0={x:0,y:0}, P1={x:0,y:0};
		for( var j=0; j<sk[i].length; j++)
		{
			var P = O_get(sp,sk[i][j]),
				app = angle(ax[i],P);
			if( acdiff(app,aa)<acdiff(ab,aa) || i===0 || i===ax.length-1)
			{	//from a to b, anti clockwise
				ap[i][0].push({ag:app,j:j});
				P0=add(P0,P);
			}
			else
			{	//from b to a, anti clockwise
				ap[i][1].push({ag:app,j:j});
				P1=add(P1,P);
			}
		}
		ap[i][0].vP = scale(P0,1/ap[i][0].length);
		ap[i][1].vP = scale(P1,1/ap[i][1].length);
	}
	return ap;
	function acdiff(a,b) //anti clockwise diff
	{
		var dy = agdiff(a,b);
		if( dy<0)
			dy = 2*Math.PI+dy;
		return dy;
	}
	function add(A,B) //A+B
	{
		return {x:A.x+B.x, y:A.y+B.y};
	}
	function scale(A,r) //A*r
	{
		return {x:A.x*r, y:A.y*r};
	}
}
function draw_skeleton(drawer,sp,ax,sk,graph)
{
	var trans = get_screen_transform_fun(graph);
	for( var i=0; i<sk.length; i++)
	{
		for( var j=0; j<sk[i].length; j++)
		{
			if( O_get(sp,sk[i][j]))
			{
				drawer.moveTo(trans(ax[i],true),3);
				drawer.lineTo(trans(O_get(sp,sk[i][j]),true),3);
			}
		}
	}
	
	var hold_stroke_width = drawer.stroke_width;
	drawer.stroke_width *= 0.5;
	drawer.draw();
	drawer.stroke_width = hold_stroke_width;
}
/*\
 * skeletal_deform
 - re (object) reconstructed stroke shape
 - ax (array of points) principal axis
 - sk (struct) skeleton
 - rx (array of points) deform to this new axis
 * assume ax and rx is point-to-point correspondence
\*/
function skeletal_deform(drawer,re,ax,sk,rx)
{
	var visualize = true && drawer;
	var max_log=0;
	var add = V.add,
		sub = V.sub,
		scale = V.scale,
		length = V.length;
	var sp = re.data,
		ast = transform(ax,true),
		dast = difference(ast),
		rst = transform(rx,true),
		drst = difference(rst),
		nsp = []; //new stroke
	nsp.length = sp.length;
	rigid_deform();
	anchor_fan();
	length_stretch();
	rectify();
	//clean_jaggy();
	delete_duplicate(nsp);
	return nsp;
	
	function rigid_deform()
	{
		for( var i=0; i<ax.length; i++)
		{
			var disp = sub(rx[i],ax[i]);
			for( var j=0; j<sk[i].length; j++)
				O_set(nsp,sk[i][j],add(O_get(sp,sk[i][j]),disp));
		}
	}
	function anchor_fan()
	{
		for( var i=1; i<ax.length-1; i++)
		{
			var aa = angle(ax[i],ax[i-1]),
				ab = angle(ax[i],ax[i+1]),
				ra = angle(rx[i],rx[i-1]),
				rb = angle(rx[i],rx[i+1]);
			var exg = exp(acdiff(rb,ra)-acdiff(ab,aa))/10, //exaggeration
				outer = (acdiff(rb,ra)>Math.PI)?1:-1;
			if( acdiff(rb+2*exg*outer,ra)>Math.PI !== (outer===1))
				exg = 0;
			for( var j=0; j<sk[i].length; j++)
			{
				var P = O_get(sp,sk[i][j]),
					ap = angle(ax[i],P);
				if( acdiff(ap,aa)<acdiff(ab,aa))
				{	//from a to b, anti clockwise
					var at = acdiff(ap,aa)/acdiff(ab,aa),
						rt = at,
						rp = (ra-exg*outer)+acdiff(rb+2*exg*outer,ra)*rt;
				}
				else
				{	//from b to a, anti clockwise
					var at = acdiff(ap,ab)/acdiff(aa,ab),
						rt = at,
						rp = (rb-exg*-outer)+acdiff(ra+2*exg*-outer,rb)*rt;
				}
				var V  = rotate_to(sub(P,ax[i]),rp),
					PP = add(rx[i],V);
				O_set(nsp,sk[i][j],PP);
			}
		}
		//end points
		for( var i=0,kkk=0; kkk<2; kkk++,i=ax.length-1)
		{
			if( i===0)
				var aa = angle(ax[i],ax[i+1]),
					ra = angle(rx[i],rx[i+1]);
			else if( i===ax.length-1)
				var aa = angle(ax[i],ax[i-1]),
					ra = angle(rx[i],rx[i-1]);
			for( var j=0; j<sk[i].length; j++)
			{
				var P  = O_get(sp,sk[i][j]),
					ap = angle(ax[i],P),
					ar = acdiff(ap,aa),
					rr = ar,
					rp = ra+rr,
					V  = rotate_to(sub(P,ax[i]),rp),
					PP = add(rx[i],V);
				O_set(nsp,sk[i][j],PP);
			}
		}
		function exp(s)
		{
			return Math.pow(s,4);
		}
	}
	function length_stretch(i,j)
	{
		for( var i=0; i<ax.length-1; i++)
		{
			//if( adiff(dast[i],drst[i])<Math.PI*0.1 || i===0)
				for( var j=0; j<sk[i].length; j++)
					stretch(i,sk[i][j]);
			//if( adiff(dast[i+1],drst[i+1])<Math.PI*0.1 || i===ax.length-2)
				for( var j=0; j<sk[i+1].length; j++)
					stretch(i,sk[i+1][j]);
		}
		function stretch(i,j)
		{
			var spj = O_get(sp,j),
				nspj = O_get(nsp,j),
				axv = sub(ax[i+1],ax[i]),
				axn = perpen(axv),
				rxv = sub(rx[i+1],rx[i]),
				rxn = perpen(rxv); //normal
			if( signed_area(spj,add(axn,ax[i]),ax[i])>0 && signed_area(spj,add(axn,ax[i+1]),ax[i+1])<0)
			{
				var apj = project(sub(spj,ax[i]),axv),
					rpj = project(sub(nspj,rx[i]),rxv),
					pl = scale(rxv,length(apj.l)/length(axv)),
					pp = scale(rxn,signed_length(apj.p,axv)/length(rxn)),
					NP = addN(rx[i],pl,pp),
					rr = length(rxv)/length(axv),
					ww = 0.5;
				if( rr<0.8)
					ww = 1;
				NP = add(scale(nspj,1-ww),scale(NP,ww));
				O_set(nsp,j,NP);
			}
		}
	}
	function rectify()
	{
		var rp = skeletonize_ap(nsp,sk,rx);
		for( var i=1; i<rp.length-1; i++)
			for( var s=0; s<2; s++)
			{
				var fan = rp[i][s].slice();
				fan.sort(function(a,b){return agdiff(a.ag,b.ag);});
				for( var j=0; j<fan.length; j++)
				{
					if( rp[i][s][j] !== fan[j])
					{
						O_set(nsp,sk[i][fan[j].j],rp[i][s].vP);
					}
				}
			}
	}
	function clean_jaggy()
	{
		var st = [],
			dst = [];
		for( var i=1; i<sk.length-1; i++) //ignor endpoints
		{
			for( var j=0; j<sk[i].length; j++)
			{
				var S = sub(O_get(nsp,sk[i][j]),rx[i]),
					A = sub(rx[i-1],rx[i]),
					B = sub(rx[i+1],rx[i]),
					pA = project(S,A),
					pB = project(S,B),
					inA = 0<=pA.x && pA.x<=length(A),
					inB = 0<=pB.x && pB.x<=length(B);
				pA.i = sk[i][j];
				pA.x = rst[i].l-pA.x;
				pB.i = sk[i][j];
				pB.x = rst[i].l+pB.x;
				if( inA && !inB)
					st[sk[i][j]] = pA;
				if(!inA &&  inB)
					st[sk[i][j]] = pB;
				if(!inA && !inB)
				{
					st[sk[i][j]] = {
						x: rst[i].l,
						y: length(S),
						i: sk[i][j]
					}
				}
			}
		}
		// remove empty elements
		for( var j=0; j<st.length; j++)
			if( st[j]===undefined)
			{
				st.splice(j,1);
				j--;
			}
		// remove duplicate
		for( var j=0; j<st.length-1; j++)
			if( st[j].x===st[j+1].x)
			{
				st.splice(j,1);
				j--;
			}
		// dydx
		for( var j=0; j<st.length-1; j++)
			dst[j] = (st[j+1].y-st[j].y)/(st[j+1].x-st[j].x);
		dst[j] = (st[0].y-st[j].y)/(st[0].x-st[j].x);
		// detect sharp
		for( var j=0; j<dst.length; j++)
		{
			if( O_get(dst,j) > 1 &&
				O_get(dst,j-1) < 1 &&
				O_get(dst,j+1) < 1 )
				//(O_get(st,j-1).x-O_get(st,j+1).x) < 0.02)
			{
				//console.log(O_get(dst,j-1),O_get(dst,j),O_get(dst,j+1));
				//console.log(O_get(st,j-1).x-O_get(st,j+1).x);
				if( visualize)
					subplotshape(drawer,re,[O_get(nsp,O_get(st,j-1).i),O_get(nsp,O_get(st,j).i),O_get(nsp,O_get(st,j+1).i)],{num:0,style:'point:1'});
				O_set(nsp,O_get(st,j).i,undefined);
				O_set(nsp,O_get(st,j-1).i,undefined);
				O_set(nsp,O_get(st,j+1).i,undefined);
			}
		}
	}
	function delete_duplicate(sp,thres)
	{
		if(!thres) thres = 0.0001;
		for( var i=0; i<sp.length-1; i++)
		{
			if( sp[i] && sp[i+1])
			if( Math.abs(sp[i].x-sp[i+1].x) < thres && 
				Math.abs(sp[i].y-sp[i+1].y) < thres)
			{
				sp[i] = undefined;
			}
		}
		return sp;
	}
	function weight(A,B,a,b)
	{
		A=scale(A,a/(a+b));
		B=scale(B,b/(a+b));
		return add(A,B);
	}
	function acdiff(a,b) //anti clockwise
	{
		var dy = agdiff(a,b);
		if( dy<0)
			dy = 2*Math.PI+dy;
		return dy;
	}
	function signed_length(A,B)
	{
		var L = length(A);
		return L * (signed_area(A,{x:0,y:0},B)>=0?1:-1);
	}
	function perpen(A)
	{
		return {x:-A.y, y:A.x};
	}
	function Langle(i,a)
	{
		var tang = full_angle(O_get(sp,i),O_get(sp,i+1)); //angle of tangent
		var centri = full_angle(ax[a],sp[i]); //angle toward center
		var agdiff = centri-tang;
		if( agdiff<0) agdiff+=2*Math.PI;
		return agdiff;
	}
	function rotate_to(A,ag)
	{
		var L = length(A),
			B = {x:Math.cos(ag)*L, y:Math.sin(ag)*L};
		return B;
	}
	function project(B,A) //project B onto A
	{
		var A = {x:A.x, y:A.y};
		//normalize A
		var l = length(A);
		A.x /= l;
		A.y /= l;
		var L=A.x*B.x+A.y*B.y; //dot product
		var C = scale(A,L);
		var D = sub(B,C);
		return {
			l:C, //parallel vector
			p:D, //perpen vector
			x:L, //projected length on A
			y:length(D) //perpen distance
			};
	}
	function addN()
	{
		var C = {x:0,y:0};
		for( var i=0; i<arguments.length; i++)
			C = add(C,arguments[i]);
		return C;
	}
}
/*\
 * 
 - 
\*/