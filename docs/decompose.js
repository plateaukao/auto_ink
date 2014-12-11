function decompose(drawer,re,st,dst)
{
	var visualize = true;
	var debug = false;
	if( debug) console.log('decompose');
	var sp = fn(function(re){return re.data},re); //the reconstructed shapes
	//st = angle-length representation
	//dst= d angle/d length of st
	var inner_corner_tor = -0.9*Math.PI, //tolerances
		smoothcut_rmsdiff_tor = Math.PI*0.25,
		angular_tor = Math.PI*0.25,
		Langular_tor = Math.PI*0.3; //tolerances
	if( typeof more_tolerant!=='undefined')
		Langular_tor = Math.PI*0.4;
	var corners = flatten(fnI(detect_corner,dst));
	var segments;
	if(!segments) segments = decomp4();
	if(!segments) segments = decomp3();
	if(!segments) segments = decomp2();
	if( segments)
		return segments;
	else //atomic stroke
		return {shape:re};
	
	function detect_corner(slot,dst)
	{
		var corners = filter(dst,3,innercornerdetect);
		var labels = [];
		for( var i=0; i<corners.length; i++)
			labels[i] = slot+':'+corners[i].I;
		if( visualize)
			subplotshape(drawer,re[0],corners,{style:'point:2'});
		if( slot==0)
		if( visualize)
			subplot({
				drawer:drawer, data:corners,
				x:'l', y:'q',
				xrange:1, yrange:2*Math.PI,
				width:100, height:100,
				num:1, style:'point:2'
			});
		return corners;

		function innercornerdetect(index,ww)
		{
			if( ww[0].dydx>=ww[1].dydx && ww[2].dydx>=ww[1].dydx &&
			   (ww[0].dydx+ww[1].dydx+ww[2].dydx<=inner_corner_tor ||
				ww[1].dydx<=inner_corner_tor))
			{
				index--;
				if( (sampling_density<200 && !hollow_scheme) || index!==this.last+1)
				{
					this.last=index;
					if( index<0) index+=sp[slot].length;
					var P = sp[slot][index];
					var Q = st[slot][index];
					return { S:slot, I:index, x:P.x, y:P.y, l:Q.l, q:Q.q };
				}
			}
		}
	}

	function decomp4()
	{
		if( debug) console.log('decomp4');
		var rectangular_min_length = 6/100,
			rectangular_angle_tor = Math.PI*0.15;
		var num_try=0;
		/** 4 way crossing
			_| |_
			_   _
			 | |
		*/
		var tried={};
		for( var i=0; i<corners.length; i++)
		{
			var dist=neighbors(i); //consider the 8 nearest neighbors of corners[i]
			//cosider all combinations of 4 chosen from 8
			var L={a:0,b:0,c:0,d:0};
			for( L.b=L.a+1; L.b<dist.length-2; L.b++)
			for( L.c=L.b+1; L.c<dist.length-1; L.c++)
			for( L.d=L.c+1; L.d<dist.length;   L.d++)
			{
				var OL = [L.a,L.b,L.c,L.d].sort(function(a,b){return dist[a].l-dist[b].l;});
				OL = {a:OL[0],b:OL[1],c:OL[2],d:OL[3]};
				var sign = [dist[OL.a].S,dist[OL.a].l,dist[OL.b].l,dist[OL.c].l,dist[OL.d].l].join(',');
				if(!tried[sign])
				{
					tried[sign] = true;
					var LL = {a:dist[OL.a],b:dist[OL.b],c:dist[OL.c],d:dist[OL.d]};
					normalize_quad();
					var result = detect(LL);
					if( result)
					{
						return recursion(result);
					}
				}
			}
		}
		
		function normalize_quad()
		{
			var a='a',b='b',c='c',d='d';
			if( LL.a.S==LL.b.S && LL.b.S==LL.c.S && LL.c.S==LL.d.S)
				return ;
			var tra = signed_area(LL.a,LL.b,LL.c)>0,
				trb = signed_area(LL.b,LL.c,LL.d)>0,
				trc = signed_area(LL.c,LL.d,LL.a)>0;
				reflex = tra != trc;
			if( reflex)
			{
				//this operation normalize the quad if reflexed while keeping it clockwise
				if( tra && trb && !trc)
				{	//swap a,d
					LL = map(LL,{a:d,b:b,c:c,d:a});
				}
				else if( tra && !trb && !trc)
				{	//swap c,d
					LL = map(LL,{a:a,b:b,c:d,d:c});
				}
				else if( !tra && trb && trc)
				{	//swap a,b
					LL = map(LL,{a:b,b:a,c:c,d:d});
				}
				else if( !tra && !trb && trc)
				{	//swap b,c
					LL = map(LL,{a:a,b:c,c:b,d:d});
				}
			}
			else if( !tra)
			{
				//make it clockwise
				//reverse
				LL = map(LL,{a:d,b:c,c:b,d:a});
			}
			else
			{	//normal
				LL = map(LL,{a:a,b:b,c:c,d:d});
			}
		}
		
		function detect(LL)
		{
			//various testes
			if( Langular() && rectangular())
			{
				var smoothcut = smoothcuttest();
				if( smoothcut)
				{
					var seg = segment4(LL,smoothcut,3);
					render_result([LL.a,LL.b,LL.c,LL.d],seg);
					return seg;
				}
			}
		}

		function Langular()
		{
			/** make sure the four points are inwardic
				_| |_
				_   _
				 | |
			*/
			var ag={a:[],b:[],c:[],d:[]};
			var cmb=[[0,1],[-1,0],[-1,1],[-1,3],[-2,2]]; //trying at different position combinations
			if( sampling_density>200 || typeof more_tolerant!=='undefined')
			{
				var cmbI = 3,
					cmb = [];
				for( var i=1; i<=cmbI; i++)
					for( var j=0; j<i; j++)
						cmb.push([-j,i-j]);
			}
			var rotate={a:false,b:false,c:false,d:false};
			for( var i in cmb)
			{
				for( var k in ag)
				{
					ag[k][0] = OS_get(st,LL[k].S,LL[k].I+cmb[i][0]).q;
					ag[k][1] = OS_get(st,LL[k].S,LL[k].I+cmb[i][1]).q;
				}
				rotate.a= rotate.a||rotate90(ag.a,ag.b);
				rotate.b= rotate.b||rotate90(ag.b,ag.c);
				rotate.c= rotate.c||rotate90(ag.c,ag.d);
				rotate.d= rotate.d||rotate90(ag.d,ag.a);
				if( rotate.a && rotate.b && rotate.c && rotate.d)
					return true;
			}
			if( debug) console.log('Langular failed');
			function rotate90(A,B)
			{
				return adiff(A[0],B[1])<Langular_tor && adiff(A[1],B[0])>Math.PI-Langular_tor;
			}
		}
		function rectangular()
		{
			var cmb=[0,-1,1]; //trying at different position combinations
			if( sampling_density>200 || typeof more_tolerant!=='undefined')
				cmb.push(2,3,4,5,-2,-3,-4,-5);
			for( var a in cmb)
			for( var b in cmb)
			for( var c in cmb)
			for( var d in cmb)
			{
				/** make sure the four points are rectangular
					 a---b
					/   /
				   d---c
				*/
				var A=OS_get(sp,LL.a.S,LL.a.I+cmb[a]),
					B=OS_get(sp,LL.b.S,LL.b.I+cmb[b]),
					C=OS_get(sp,LL.c.S,LL.c.I+cmb[c]),
					D=OS_get(sp,LL.d.S,LL.d.I+cmb[d]);
				if( (A.S!=B.S || Math.abs(A.l-B.l) > rectangular_min_length) &&
					(B.S!=C.S || Math.abs(B.l-C.l) > rectangular_min_length) &&
					(C.S!=D.S || Math.abs(C.l-D.l) > rectangular_min_length) &&
					(D.S!=A.S || Math.abs(D.l-A.l) > rectangular_min_length) )
				if( adiff(angle(A,B),angle(B,C))-Math.PI/2 < rectangular_angle_tor &&
					adiff(angle(B,C),angle(C,D))-Math.PI/2 < rectangular_angle_tor &&
					adiff(angle(C,D),angle(D,A))-Math.PI/2 < rectangular_angle_tor &&
					adiff(angle(D,A),angle(A,B))-Math.PI/2 < rectangular_angle_tor )
					return true;
			}
			if( debug) console.log('rectangular failed');
		}
		function smoothcuttest()
		{
			var pairAB = smoothpair(LL.a,LL.b),
				pairCD = smoothpair(LL.c,LL.d),
				pairDA = smoothpair(LL.d,LL.a),
				pairBC = smoothpair(LL.b,LL.c);
			if( (pairAB && pairCD) || (pairDA && pairBC) )
			{
				if (!pairAB) pairAB = smoothconnect(LL.a,LL.b);
				if (!pairCD) pairCD = smoothconnect(LL.c,LL.d);
				if (!pairDA) pairDA = smoothconnect(LL.d,LL.a);
				if (!pairBC) pairBC = smoothconnect(LL.b,LL.c);
				return { AB:pairAB, CD:pairCD, DA:pairDA, BC:pairBC };
			}
			if( debug) console.log('smoothcuttest failed');
		}
		function segment4(LL,pair,retry)
		{
			/*ssp[0] = O_slice(sp,pairCD.b,pairAB.a).concat(pairAB.c).concat(O_slice(sp,pairAB.b,pairCD.a)).concat(pairCD.c);
			ssp[1] = O_slice(sp,pairDA.b,pairBC.a).concat(pairBC.c).concat(O_slice(sp,pairBC.b,pairDA.a)).concat(pairDA.c);
			subplotshape(drawer,re,O_slice(sp,pairCD.b,pairAB.a),{style:'line:1',closepath:false});
			*/
			var ab,bc,cd,da,
				ba,cb,dc,ad;
			if( debug) console.log(LL.a.S,LL.b.S,LL.c.S,LL.d.S);
			var seg = [];
			if( LL.a.S==LL.b.S) {
				ab = O_slice(sp[LL.a.S],pair.DA.b,pair.BC.a);
				ba = O_slice(sp[LL.a.S],pair.AB.b,pair.AB.a);
			} else if( LL.b.S!=LL.c.S && LL.c.S!=LL.d.S)
				ab = O_slice(sp[LL.a.S],pair.DA.b,pair.AB.a).concat(pair.AB.c).concat(O_slice(sp[LL.b.S],pair.AB.b,pair.BC.a));
			if( LL.b.S==LL.c.S) {
				bc = O_slice(sp[LL.b.S],pair.AB.b,pair.CD.a);
				cb = O_slice(sp[LL.b.S],pair.BC.b,pair.BC.a);
			} else if( LL.a.S!=LL.b.S && LL.c.S!=LL.d.S)
				bc = O_slice(sp[LL.b.S],pair.AB.b,pair.BC.a).concat(pair.BC.c).concat(O_slice(sp[LL.c.S],pair.BC.b,pair.CD.a));
			if( LL.c.S==LL.d.S) {
				cd = O_slice(sp[LL.c.S],pair.BC.b,pair.DA.a);
				dc = O_slice(sp[LL.c.S],pair.CD.b,pair.CD.a);
			} else if( LL.b.S!=LL.c.S && LL.a.S!=LL.d.S)
				cd = O_slice(sp[LL.c.S],pair.BC.b,pair.CD.a).concat(pair.CD.c).concat(O_slice(sp[LL.d.S],pair.CD.b,pair.DA.a));
			if( LL.d.S==LL.a.S) {
				da = O_slice(sp[LL.d.S],pair.CD.b,pair.AB.a);
				ad = O_slice(sp[LL.d.S],pair.DA.b,pair.DA.a);
			} else if( LL.a.S!=LL.b.S && LL.c.S!=LL.d.S)
				da = O_slice(sp[LL.d.S],pair.CD.b,pair.DA.a).concat(pair.DA.c).concat(O_slice(sp[LL.a.S],pair.DA.b,pair.AB.a));
			if( LL.a.S!=LL.b.S && LL.a.S!=LL.c.S && LL.a.S!=LL.d.S &&
				LL.b.S!=LL.c.S && LL.b.S!=LL.d.S &&
				LL.c.S!=LL.d.S)
			{	//4 points from 4 distinct sections
				if( !(0 in values(LL.a.S,LL.b.S,LL.c.S,LL.d.S)))
				{
					var longest = longest_among(map(sp,minus(range(0,sp.length-1),[LL.a.S,LL.b.S,LL.c.S,LL.d.S])));
					if( longest!==0) console.log('decompose: sp[0] not longest');
					seg.push(sp[0]);
				}
				seg.push([ab.concat(pair.BC.c).concat(cd).concat(pair.DA.c)]);
				for( var i=1; i<sp.length; i++)
				{
					if( !(i in values(LL.a.S,LL.b.S,LL.c.S,LL.d.S)))
						seg[0].push(sp[i]);
				}
			}
			else
			{
				if( debug) console.log(ab&&ab.length,bc&&bc.length,cd&&cd.length,da&&da.length);
				if( ab && cd && bc && da)
				{	//2 shapes
					seg[0] = [ab.concat(pair.BC.c).concat(cd).concat(pair.DA.c)];
					seg[1] = [bc.concat(pair.CD.c).concat(da).concat(pair.AB.c)];
				}
				else if( (ab && cd) && !(bc && da))
				{
					seg[0] = [];
					if( !(0 in values(LL.a.S,LL.b.S,LL.c.S,LL.d.S)))
						seg[0].push(sp[0]);
					if( ba && dc)
					{	//2 shapes
						if( LL.a.S==0 || LL.b.S==0)
							seg[0].push(ba.concat(pair.AB.c),dc.concat(pair.CD.c)); //hollow
						else
							seg[0].push(dc.concat(pair.CD.c),ba.concat(pair.AB.c)); //hollow
						seg[1] = [ab.concat(pair.BC.c).concat(cd).concat(pair.DA.c)];
					}
					else if( ba && !dc)
					{	//1 shape, hollow
						seg[0].push(
							ba.concat(pair.AB.c), //outer
							ab.concat(pair.BC.c).concat(cd).concat(pair.DA.c) //inner
						);
					}
					else if( !ba && dc)
					{	//1 shape, hollow
						seg[0].push(
							dc.concat(pair.CD.c), //outer
							ab.concat(pair.BC.c).concat(cd).concat(pair.DA.c) //inner
						);
					}
					else
						console.log('topological error');
					//seg.push([bc.concat(pair.CD.c).concat(da).concat(pair.AB.c)]);
					//seg.push([ad.concat(pair.DA.c),cb.concat(pair.BC.c)]);
					//seg.push([ba.concat(pair.AB.c),dc.concat(pair.CD.c)]);
				}
				else if( (ab && bc) && !(cd && da))
				{	//1 shape
					console.log('topological error');
				}
				if( seg.length>0)
				{
					var longest = longest_mm(seg);
					for( var i=1; i<sp.length; i++)
					{
						if( !(i in values(LL.a.S,LL.b.S,LL.c.S,LL.d.S)))
							seg[longest].push(sp[i]);
					}
				}
			}
			if( seg.length>0)
				return seg;
			else if( retry)
				return segment4( //shift and retry
					{ a:LL.b, b:LL.c, c:LL.d, d:LL.a},
					{ AB:pair.BC, BC:pair.CD, CD:pair.DA, DA:pair.AB},
					retry-1 );
			else
				console.log('segment4 failed');
		}
	}
	
	function decomp3()
	{
		/** 3 way crossing (1 trunk 2 branches)
			________
			__    __
			 / /\ \
		*/
		var tried={},
			trunk, branch;
		for( var i=0; i<corners.length; i++)
		{
			var dist=neighbors(i); //consider the 8 nearest neighbors of corners[i]
			//cosider all combinations of 3 chosen from 8
			var L={a:0,b:0,c:0};
			for( L.b=L.a+1; L.b<dist.length-1; L.b++)
			for( L.c=L.b+1; L.c<dist.length;   L.c++)
			{
				var OL = [L.a,L.b,L.c].sort(function(a,b){return dist[a].l-dist[b].l;});
				OL = {a:OL[0],b:OL[1],c:OL[2]};
				var sign = [dist[OL.a].S,dist[OL.a].l,dist[OL.b].l,dist[OL.c].l].join(',');
				if(!tried[sign])
				{
					tried[sign] = true;
					var LL = {a:dist[OL.a], b:dist[OL.b], c:dist[OL.c]};
					var result = detect();
					if( result)
					{
						return recursion(result);
					}
				}
			}
		}
		
		function detect()
		{
			if( angular() && triangular())
			{
				var smoothcut = smoothcuttest();
				if( smoothcut)
				{
					var seg = segment3(smoothcut);
					render_result([LL.a,LL.b,LL.c],seg);
					return seg;
				}
			}
		}
		function angular()
		{
			//find out the trunk and branches
			//assume anticlockwise contour
			var K=[0,1,2]; //at different positions
			
			var num_branch=0, num_trunk=0;
			branch={bc:false,ca:false,ab:false}; trunk=false;
			//search for branches
			for( var cmb in branch)
				for( var i in K)
					if( apara(OS_get(st,LL[cmb.charAt(0)].S,LL[cmb.charAt(0)].I+K[i]).q, OS_get(st,LL[cmb.charAt(1)].S,LL[cmb.charAt(1)].I-K[i]).q) )
						branch[cmb] = true;
			//search for trunk
			for( var k in branch) if( !branch[k]) trunk = k;
			if( trunk)
				for( var i in K)
					if( para(OS_get(st,LL[trunk.charAt(0)].S,LL[trunk.charAt(0)].I+K[i]).q, OS_get(st,LL[cmb.charAt(1)].S,LL[trunk.charAt(1)].I-K[i]).q))
						num_trunk=1;
			//count
			for( var cmb in branch)
				if( branch[cmb])
					num_branch++;
			if( num_trunk===1 && num_branch===2)
				return true;
		}
		function triangular()
		{
			var triangular_min_length = 3/100,
				triangular_max_length = 15/100,
				triangular_max_ratio = 2.5,
				section_min_length = 12/100;
			var cmb=[0,-1,1]; //trying at different position combinations
			for( var a in cmb)
			for( var b in cmb)
			for( var c in cmb)
			{
				/** make sure the three points are triangular
					 a     ^
					/ \    | tall
				   c---b   v
				*/
				var A=OS_get(sp,LL.a.S,LL.a.I+cmb[a]),
					B=OS_get(sp,LL.b.S,LL.b.I+cmb[b]),
					C=OS_get(sp,LL.c.S,LL.c.I+cmb[c]),
					AL=distance(A,B),
					BL=distance(B,C),
					CL=distance(C,A),
					minL=Math.min(AL,BL,CL),
					maxL=Math.max(AL,BL,CL),
					midL=middle(AL,BL,CL);
				if( triangular_min_length < AL && AL < triangular_max_length && 
					triangular_min_length < BL && BL < triangular_max_length &&
					triangular_min_length < CL && CL < triangular_max_length &&
					(LL.a.S!=LL.b.S || Math.abs(A.l-B.l)>section_min_length) &&
					(LL.b.S!=LL.c.S || Math.abs(B.l-C.l)>section_min_length) &&
					(LL.c.S!=LL.a.S || Math.abs(C.l-A.l)>section_min_length) &&
					maxL/midL > 1.5 && //must be short isosceles
					maxL/minL < triangular_max_ratio && //not too tall
					maxL/(minL+midL) < 0.85) //not too short
					return true;
			}
			function middle(a,b,c)
			{
				if( (b<=a&&a<=c) || (c<=a&&a<=b))
					return a;
				if( (a<=b&&b<=c) || (c<=b&&b<=a))
					return b;
				if( (a<=c&&c<=b) || (b<=c&&c<=a))
					return c;
			}
		}
		function smoothcuttest()
		{
			if ( trunk && smoothpair(LL[trunk.charAt(1)],LL[trunk.charAt(0)],true))
			{
				return {
					ab:smoothconnect(LL.a,LL.b,1.5),
					ba:smoothconnect(LL.b,LL.a,1.5),
					bc:smoothconnect(LL.b,LL.c,1.5),
					cb:smoothconnect(LL.c,LL.b,1.5),
					ca:smoothconnect(LL.c,LL.a,1.5),
					ac:smoothconnect(LL.a,LL.c,1.5)
				};
			}
		}
		function segment3(pair)
		{
			var remain = {ab:'c',bc:'a',ca:'b'};
			var rtrunk = trunk.split('').reverse().join('');
			var seg = [];
			if( LL.a.S==LL.b.S && LL.b.S==LL.c.S)
			{	// K type
				var S = LL.a.S;
				//3 shapes
				seg[0] = [O_slice(sp[S],pair.ba.b,pair.ba.a).concat(pair.ba.c)];
				seg[1] = [O_slice(sp[S],pair.cb.b,pair.cb.a).concat(pair.cb.c)];
				seg[2] = [O_slice(sp[S],pair.ac.b,pair.ac.a).concat(pair.ac.c)];
			}
			else
			{
				seg[0] = [];
				if( !(0 in values(LL.a.S,LL.b.S,LL.c.S)))
					seg[0].push(sp[0]);
				if( LL.a.S!=LL.b.S && LL.b.S!=LL.c.S && LL.c.S!=LL.a.S)
				{	// B type
					seg[0].push( //1 shape, but 2 sections (hollow)
						sp[LL[remain[trunk]].S],
						O_slice(sp[LL[trunk.charAt(0)].S],pair[rtrunk].b,pair[trunk].a)
						.concat(pair[trunk].c)
						.concat(O_slice(sp[LL[trunk.charAt(1)].S],pair[trunk].b,pair[rtrunk].a))
						.concat(pair[rtrunk].c)
					);
				}
				else if( LL[trunk.charAt(0)].S == LL[trunk.charAt(1)].S &&
					LL[trunk.charAt(0)].S != LL[remain[trunk]].S)
				{	// Kl type
					//2 shapes
					seg[0] = [O_slice(sp[LL[trunk.charAt(0)].S],pair[rtrunk].b,pair[rtrunk].a).concat(pair[rtrunk].c)];
					seg[1] = [O_slice(sp[LL[trunk.charAt(0)].S],pair[trunk].b,pair[trunk].a).concat(pair[trunk].c),
							sp[LL[remain[trunk]].S] ]; //hollow
				}
				else if( (LL[trunk.charAt(0)].S != LL[trunk.charAt(1)].S) &&
						 (LL[trunk.charAt(0)].S == LL[remain[trunk]].S ||
						  LL[trunk.charAt(1)].S == LL[remain[trunk]].S) )
				{
					// R type
					seg[0].push( //1 shape
						O_slice(sp[LL[trunk.charAt(0)].S],pair[rtrunk].b,pair[trunk].a)
						.concat(pair[trunk].c)
						.concat(O_slice(sp[LL[trunk.charAt(1)].S],pair[trunk].b,pair[rtrunk].a))
						.concat(pair[rtrunk].c)
					);
				}
			}
			var longest = longest_mm(seg);
			for( var i=1; i<sp.length; i++)
			{
				if( !(i in values(LL.a.S,LL.b.S,LL.c.S)))
					seg[longest].push(sp[i]);
			}
			return seg;
		}
	}
	
	function decomp2()
	{
		/** 2 way crossing   (trunk and branch)
			_______   | |__
			__   __   |  __
			  | |     | |
		*/
		var tried={},
			trunk, branch;
		for( var i=0; i<corners.length; i++)
		{
			var dist=neighbors(i); //consider the 8 nearest neighbors of corners[i]
			//cosider all combinations of 2 chosen from 8
			var L={a:0,b:0};
			for( L.b=L.a+1; L.b<dist.length; L.b++)
			{
				var OL = [L.a,L.b].sort(function(a,b){return dist[a].l-dist[b].l;});
				OL = {a:OL[0],b:OL[1]};
				var sign = [dist[OL.a].S,dist[OL.a].l,dist[OL.b].l].join(',');
				if(!tried[sign])
				{
					tried[sign] = true;
					var LL = {a:dist[OL.a], b:dist[OL.b]};
					var result = detect();
					if( result)
					{
						return recursion(result);
					}
				}
			}
		}
		function detect()
		{
			if( section_length() && Langular() && angular())
			{
				var smoothcut = smoothcuttest();
				if( smoothcut)
				{
					var seg = segment2(smoothcut);
					render_result([LL.a,LL.b],seg);
					return seg;
				}
			}
		}
		function section_length()
		{
			var section_min_length = 8/100,
				min_distance = 1/100,
				max_distance = 15/100;
			if( LL.a.S==LL.b.S && Math.abs(LL.a.l-LL.b.l)<section_min_length)
				return false;
			if( distance(LL.a,LL.b)<min_distance)
				return false;
			if( distance(LL.a,LL.b)>max_distance)
				return false;
			return true;
		}
		function Langular()
		{
			var Langular_tor = Math.PI*0.4;
			/** inwardic test
				_   _
				 | |
			*/
			var ag={a:[],b:[]};
			var cmb=[[0,1],[-1,0],[-1,1],[-2,2]]; //trying at different position combinations
			var rotate={a:false};
			for( var i in cmb)
			{
				for( var k in ag)
				{
					ag[k][0] = OS_get(st,LL[k].S,LL[k].I+cmb[i][0]).q;
					ag[k][1] = OS_get(st,LL[k].S,LL[k].I+cmb[i][1]).q;
				}
				rotate.a = rotate.a||rotate90(ag.a,ag.b)||rotate90(ag.b,ag.a);
				if( rotate.a)
					return true;
			}
			function rotate90(A,B)
			{
				return adiff(A[0],B[1])<Langular_tor && adiff(A[1],B[0])>Math.PI-Langular_tor;
			}
		}
		function angular()
		{
			//non self parallel
			if( para(OS_get(st,LL.a.S,LL.a.I+2).q, OS_get(st,LL.a.S,LL.a.I-2).q))
				return false;
			if( para(OS_get(st,LL.b.S,LL.b.I+2).q, OS_get(st,LL.b.S,LL.b.I-2).q))
				return false;
			//find out the branch and trunk
			branch=false; trunk=false;
			var K=[0,1,2]; //at different positions
			for( var i in K)
			{
				if( apara(OS_get(st,LL.a.S,LL.a.I+K[i]).q, OS_get(st,LL.b.S,LL.b.I-K[i]).q))
					branch = 'a+b-';
				if(  para(OS_get(st,LL.a.S,LL.a.I+K[i]).q, OS_get(st,LL.b.S,LL.b.I-K[i]).q))
					trunk  = 'a+b-';
			}
			for( var i in K)
			{
				if( apara(OS_get(st,LL.a.S,LL.a.I-K[i]).q, OS_get(st,LL.b.S,LL.b.I+K[i]).q))
					branch = 'a-b+';
				if(  para(OS_get(st,LL.a.S,LL.a.I-K[i]).q, OS_get(st,LL.b.S,LL.b.I+K[i]).q))
					trunk  = 'a-b+';
			}
			if( branch && trunk)
				return true;
		}
		function smoothcuttest()
		{
			var pairAB, pairBA;
			if( trunk==='a-b+')
				pairAB = smoothpair(LL.a,LL.b,false);
			if( trunk==='a+b-')
				pairBA = smoothpair(LL.b,LL.a,true);
			if( pairAB || pairBA)
			{
				if(!pairAB)
					pairAB = smoothconnect(LL.a,LL.b,1);
				if(!pairBA)
					pairBA = smoothconnect(LL.b,LL.a,1);
				return {AB:pairAB,BA:pairBA};
			}
		}
		function segment2(pair)
		{
			var seg = [];
			if( LL.a.S == LL.b.S)
			{
				var S = LL.a.S;
				seg[0] = [];
				seg[1] = [];
				if( LL.a.S!=0)
				{
					if( trunk==='a+b-') seg[0].push(sp[0]);
					if( trunk==='a-b+') seg[1].push(sp[0]);
				}
				seg[0].push(O_slice(sp[S],pair.BA.b,pair.BA.a).concat(pair.BA.c));
				seg[1].push(O_slice(sp[S],pair.AB.b,pair.AB.a).concat(pair.AB.c));
			}
			else if( LL.a.S != LL.b.S)
			{
				seg[0] = [];
				if( LL.a.S!=0 && LL.b.S!=0) //theta type
					seg[0].push(sp[0]);
				else
					; // b type
				seg[0].push(
					O_slice(sp[LL.a.S],pair.BA.b,pair.AB.a).concat(pair.AB.c)
						.concat(O_slice(sp[LL.b.S],pair.AB.b,pair.BA.a)).concat(pair.BA.c)
				);
				if( 0)
				{	//section visualization
					subplotshape(drawer,re[0],O_slice(sp[LL.a.S],pair.BA.b,pair.AB.a),{style:'line:1',closepath:false});
					subplotshape(drawer,re[0],[O_get(sp[LL.a.S],pair.BA.b),O_get(sp[LL.a.S],pair.AB.a)],
						{label:[pair.BA.b,pair.AB.a],style:'point:0'});
					subplotshape(drawer,re[0],pair.AB.c,{style:'line:2',closepath:false});
					subplotshape(drawer,re[0],O_slice(sp[LL.b.S],pair.AB.b,pair.BA.a),{style:'line:3',closepath:false});
					subplotshape(drawer,re[0],pair.BA.c,{style:'line:4',closepath:false});
				}
			}
			var longest = longest_mm(seg);
			for( var i=1; i<sp.length; i++)
			{
				if( !(i in values(LL.a.S,LL.b.S)))
					seg[longest].push(sp[i]);
			}
			return seg;
		}
	}
	
	function recursion(result)
	{
		var res = [];
		for( var i=0; i<result.length; i++)
			res[i] = process_shape(result[i]);
		return res;
	}
	function smoothpair(AP,BP,reverse)
	{
		var test_range=4,
			sample_dist=4;
		if( sampling_density>200 || typeof more_tolerant!=='undefined')
		{
			test_range=8;
			sample_dist=6;
		}
		//a,b are the cut points
		var minc;
		if( hollow_scheme)
			for( var a=AP.I; a>AP.I-test_range; a--) //retreat from AP
			for( var b=BP.I; b<BP.I+test_range; b++) //advance from BP
			{
				var cg = angle(OS_get(sp,AP.S,a),OS_get(sp,BP.S,b)); //the connector angle
				var sumdiff=0, number=0; //sum of square difference to cg
				for( var i=a; i>a-sample_dist; i--,number++) //retreat from a
				{
					var ag = angle(OS_get(sp,AP.S,i),OS_get(sp,AP.S,i+1));
					sumdiff += square(adiff(cg,ag));
				}
				for( var j=b; j<b+sample_dist; j++,number++) //advance from b
				{
					var bg = angle(OS_get(sp,BP.S,j),OS_get(sp,BP.S,j+1));
					sumdiff += square(adiff(cg,bg));
				}
				var rmsdiff = Math.sqrt(sumdiff/number);
				if( minc===undefined || rmsdiff<minc.rmsdiff) //minimize the difference to cg
					minc = { rmsdiff:rmsdiff, a:a, b:b+1, c:straight_bridge(sp[AP.S],a,sp[BP.S],b+1,10)};
			}
		else
			for( var a=AP.I; a>AP.I-test_range; a--) //retreat from AP
			for( var b=BP.I; b<BP.I+test_range; b++) //advance from BP
			{
				var cag = (reverse?1:-1)*angle(OS_get(sp,AP.S,a),OS_get(sp,BP.S,b)); //the connector angle
				var sumdiff=0, number=0; //sum of square difference to cag
				for( var i=a; i>a-sample_dist; i--,number++) //retreat from a
					sumdiff += square(adiff(cag,OS_get(st,AP.S,i).q));
				for( var j=b; j<b+sample_dist; j++,number++) //advance from b
					sumdiff += square(adiff(cag,OS_get(st,BP.S,j).q));
				var rmsdiff = Math.sqrt(sumdiff/number);
				if( minc===undefined || rmsdiff<minc.rmsdiff) //minimize the difference to cag
					minc = { rmsdiff:rmsdiff, a:a, b:b+1, c:straight_bridge(sp[AP.S],a,sp[BP.S],b+1,10)};
			}
		if( minc && minc.rmsdiff < smoothcut_rmsdiff_tor)
		{
			return minc; //return the best cut points
		}
		function square(x)
		{
			return x*x;
		}
	}
	function smoothconnect(AP,BP,roundness)
	{
		var test_range = 3,
			smoothconnect_tor = Math.PI*0.6;
		if( !roundness)
			roundness = 1;
		for( var a=AP.I; a>AP.I-test_range; a--) //retreat from AP
			if( Math.abs(OS_get(dst,AP.S,a+1).dydx) < smoothconnect_tor)
				break;
		for( var b=BP.I; b<BP.I+test_range; b++) //advance from BP
			if( Math.abs(OS_get(dst,BP.S,b+1).dydx) < smoothconnect_tor)
				break;
		//search for the best connect points a,b
		return {a:a,b:b,c:smooth_bridge(sp[AP.S],a,sp[BP.S],b,roundness,10)};
	}
	function para(A,B)
	{	//parallel
		return adiff(A,B)<angular_tor;
	}
	function apara(A,B)
	{	//anti parallel
		return adiff(A,B)>Math.PI-angular_tor;
	}
	function render_result(cross,shapes)
	{
		if( visualize)
		{
			subplotshape(drawer,re[0],cross,{style:'point:1'});
			//subplotshape(drawer,re,cross,{style:'line:1'});
		}
		if( 0)
		if( visualize)
			for( var i in shapes)
				for( var j in shapes[i])
					subplotshape(drawer,re[0],shapes[i][j],{style:'line:3'});
	}
	function longest_among(ssp)
	{
		var longest = -1, slength = 0;
		for( var i=0; i<ssp.length; i++)
			if( ssp[i].length > slength) {
				longest = i; slength = ssp[i].length;
			}
		return longest;
	}
	function longest_mm(ssp)
	{
		var longest = -1, slength = 0;
		for( var i=0; i<ssp.length; i++)
			if( ssp[i][0].length > slength) {
				longest = i; slength = ssp[i][0].length;
			}
		return longest;
	}
	function map(sett,indices)
	{
		var res = [];
		for( var i in indices)
			res[i] = sett[indices[i]];
		return res;
	}
	function minus(sett,from)
	{
		var res = [];
		for( var i in sett)
			if( from.indexOf(sett[i])==-1)
				res.push(sett[i]);
		return res;
	}
	function range(from,to)
	{
		var res=[];
		for( var i=from; i<=to; i++)
			res.push(i);
	}
	function values()
	{
		var obj = {};
		for( var i=0; i<arguments.length; i++)
			obj[arguments[i]] = null;
		return obj;
	}

	function neighbors(i)
	{
		var NN=8; //consider the NN nearest neighbor of corners[i]
		var dist=[],res=[];
		for( var j=0; j<corners.length; j++)
			if( i===j || distance(corners[i],corners[j])!==0)
				dist.push({pt:corners[j],dist:distance(corners[i],corners[j])});
		dist.sort(function(a,b){return a.dist-b.dist;});
		for( var k=0; k<NN && k<dist.length; k++)
			res[k] = dist[k].pt;
		return res;
	}
}