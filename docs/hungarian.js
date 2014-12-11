/**
Assignment Problem - Let C be an nxm matrix representing the costs of each of n workers to perform any of m jobs.  The assignment problem is to assign jobs to workers so as to minimize the total cost. Since each worker can perform only one job and each job can be assigned to only one worker the assignments constitute an independent set of the matrix C.
This algorithm is often known as the Hungarian method. The complexity is O(n^3) in the worst case.

Example:
hungarian([
	[1, 2, 3, 4],
	[2, 4, 6, 8],
	[3, 6, 9,12],
	[4, 8,12,16]]);
returns:
	[
	[0,0,0,1],
	[0,0,1,0],
	[0,1,0,0],
	[1,0,0,0]]

The original C# implementation is found on http://csclab.murraystate.edu/bob.pilgrim/445/munkres.html
Also supports negative costs
 */
function hungarian(CostMatrix,make_square)
{
	var debug = false,
		max_iteration = 1000;
	var C, M, path, RowCover, ColCover,
		nrow, ncol, path_count = 0,
		path_row_0, path_col_0,
		step;

	nrow = CostMatrix.length;
	ncol = CostMatrix[0].length;
	C = makeCopy(CostMatrix);
	if( make_square)
		makeSquare();
	tidy();
	if( debug) console.log('Cost Matrix');
	ShowMatrix(C);
	resetMaskandCovers();
	path = array2D(nrow*2+1,2);
	RunMunkres();
	if( debug) console.log('Assignment Matrix');
	ShowMatrix(M);
	return M;

	function makeCopy(C)
	{
		var NC = new Array(nrow);
		for( var i=0; i<nrow; i++)
		{
			NC[i] = new Array(ncol);
			for( var j=0; j<ncol; j++)
				NC[i][j] = C[i][j];
		}
		return NC;
	}
	
	function tidy()
	{
		var off = find_most_negative();
		if( off<0)
		{
			for( var i=0; i<nrow; i++)
				for( var j=0; j<ncol; j++)
					C[i][j]-=off;
		}
	}
	
	function find_most_negative()
	{
		var neg=0;
		for( var i=0; i<nrow; i++)
			for( var j=0; j<ncol; j++)
				if( C[i][j]<neg)
					neg = C[i][j];
		return neg;
	}

	function makeSquare()
	{
		if( nrow!==ncol)
		{
			if( ncol<nrow)
			{
				for( var i=0; i<C.length; i++)
					for( var j=ncol; j<nrow; j++)
						C[i][j] = 0;		
				ncol=nrow;
			}
			if( nrow<ncol)
			{
				for( var i=nrow; i<ncol; i++)
				{
					C[i] = [];
					for( var j=0; j<ncol; j++)
						C[i][j] = 0;
				}
				nrow=ncol;
			}
		}
	}

	function loadMatrix(inputtext)
	{
		var lines = inputtext.split('\n');
		nrow = 0;
		for( var i=0; i<lines.length; i++)
		{
			var text = lines[i];
			ncol = 0;
			var words = text.split(' ');
			for (var word in words)
			{
				if (word.length)
				{
					if (!C[nrow]) C[nrow] = [];
					C[nrow][ncol] = parseInt(word);
					ncol += 1;
				}
			}
			nrow += 1;
		}
		resetMaskandCovers();
		path = array2D(nrow*2+1,2);
	}

	function array2D(rows,cols)
	{
		var A=[];
		for( var i=0; i<rows; i++)
		{
			A[i] = new Array(cols);
			for( var j=0; j<cols; j++)
				A[i][j] = 0;
		}
		return A;
	}

	function resetMaskandCovers()
	{
		RowCover = [];
		M = [];
		for (var r = 0; r < nrow; r++)
		{
			RowCover[r] = 0;
			for (var c = 0; c < ncol; c++)
			{
				if (!M[r]) M[r] = [];
				M[r][c] = 0;
			}
		}
		ColCover = [];
		for (var c = 0; c < ncol; c++)
			ColCover[c] = 0;
	}

	//For each row of the cost matrix, find the smallest element and subtract
	//it from every element in its row.  When finished, Go to Step 2.
	function step_one()
	{
		var min_in_row;

		for (var r = 0; r < nrow; r++)
		{
			min_in_row = C[r][0];
			for (var c = 0; c < ncol; c++)
				if (C[r][c] < min_in_row)
					min_in_row = C[r][c];
			for (var c = 0; c < ncol; c++)
				C[r][c] -= min_in_row;
		}
		step = 2;
	}

	//Find a zero (Z) in the resulting matrix.  If there is no starred 
	//zero in its row or column, star Z. Repeat for each element in the 
	//matrix. Go to Step 3.
	function step_two()
	{
		for (var r = 0; r < nrow; r++)
			for (var c = 0; c < ncol; c++)
			{
				if (C[r][c] == 0 && RowCover[r] == 0 && ColCover[c] == 0)
				{
					M[r][c] = 1;
					RowCover[r] = 1;
					ColCover[c] = 1;
				}
			}
		for (var r = 0; r < nrow; r++)
			RowCover[r] = 0;
		for (var c = 0; c < ncol; c++)
			ColCover[c] = 0;
		step = 3;
	}

	//Cover each column containing a starred zero.  If K columns are covered, 
	//the starred zeros describe a complete set of unique assignments.  In this 
	//case, Go to DONE, otherwise, Go to Step 4.
	function step_three()
	{
		var colcount;
		for (var r = 0; r < nrow; r++)
			for (var c = 0; c < ncol; c++)
				if (M[r][c] == 1)
					ColCover[c] = 1;

		colcount = 0;
		for (var c = 0; c < ncol; c++)
			if (ColCover[c] == 1)
				colcount += 1;
		if (colcount >= ncol || colcount >=nrow)
			step = 7;
		else
			step = 4;
	}

	//methods to support step 4
	function find_a_zero(row, col)
	{
		var r = 0;
		var c;
		var done;
		row = -1;
		col = -1;
		done = false;
		while (!done)
		{
			c = 0;
			while (true)
			{
				if (C[r][c] == 0 && RowCover[r] == 0 && ColCover[c] == 0)
				{
					row = r;
					col = c;
					done = true;
				}
				c += 1;
				if (c >= ncol || done)
					break;
			}
			r += 1;
			if (r >= nrow)
				done = true;
		}
		return {row:row,col:col};
	}

	function star_in_row(row)
	{
		var tmp = false;
		for (var c = 0; c < ncol; c++)
			if (M[row][c] == 1)
				tmp = true;
		return tmp;
	}

	function find_star_in_row(row, col)
	{
		col = -1;
		for (var c = 0; c < ncol; c++)
			if (M[row][c] == 1)
				col = c;
		return col;
	}

	//Find a noncovered zero and prime it.  If there is no starred zero 
	//in the row containing this primed zero, Go to Step 5.  Otherwise, 
	//cover this row and uncover the column containing the starred zero. 
	//Continue in this manner until there are no uncovered zeros left. 
	//Save the smallest uncovered value and Go to Step 6.
	function step_four()
	{
		var row = -1;
		var col = -1;
		var done;

		done = false;
		while (!done)
		{
			var res = find_a_zero(row,col);
			row = res.row;
			col = res.col;
			if (row == -1)
			{
				done = true;
				step = 6;
			}
			else
			{
				M[row][col] = 2;
				if (star_in_row(row))
				{
					col = find_star_in_row(row, col);
					RowCover[row] = 1;
					ColCover[col] = 0;
				}
				else
				{
					done = true;
					step = 5;
					path_row_0 = row;
					path_col_0 = col;
				}
			}
		}
	}

	// methods to support step 5
	function find_star_in_col(c, r)
	{
		r = -1;
		for (var i = 0; i < nrow; i++)
			if (M[i][c] == 1)
				r = i;
		return r;
	}

	function find_prime_in_row(r, c)
	{
		for (var j = 0; j < ncol; j++)
			if (M[r][j] == 2)
				c = j;
		return c;
	}

	function augment_path()
	{
		for (var p = 0; p < path_count; p++)
			if (M[path[p][0]][path[p][1]] == 1)
				M[path[p][0]][path[p][1]] = 0;
			else
				M[path[p][0]][path[p][1]] = 1;
	}

	function clear_covers()
	{
		for (var r = 0; r < nrow; r++)
			RowCover[r] = 0;
		for (var c = 0; c < ncol; c++)
			ColCover[c] = 0;
	}

	function erase_primes()
	{
		for (var r = 0; r < nrow; r++)
			for (var c = 0; c < ncol; c++)
				if (M[r][c] == 2)
					M[r][c] = 0;
	}


	//Construct a series of alternating primed and starred zeros as follows.  
	//Let Z0 represent the uncovered primed zero found in Step 4.  Let Z1 denote 
	//the starred zero in the column of Z0 (if any). Let Z2 denote the primed zero 
	//in the row of Z1 (there will always be one).  Continue until the series 
	//terminates at a primed zero that has no starred zero in its column.  
	//Unstar each starred zero of the series, star each primed zero of the series, 
	//erase all primes and uncover every line in the matrix.  Return to Step 3.
	function step_five()
	{
		var done;
		var r = -1;
		var c = -1;

		path_count = 1;
		path[path_count - 1][0] = path_row_0;
		path[path_count - 1][1] = path_col_0;
		done = false;
		while (!done)
		{
			r = find_star_in_col(path[path_count - 1][1], r);
			if (r > -1)
			{
				path_count += 1;
				path[path_count - 1][0] = r;
				path[path_count - 1][1] = path[path_count - 2][1];
			}
			else
				done = true;
			if (!done)
			{
				c = find_prime_in_row(path[path_count - 1][0], c);
				path_count += 1;
				path[path_count - 1][0] = path[path_count - 2][0];
				path[path_count - 1][1] = c;
			}
		}
		augment_path();
		clear_covers();
		erase_primes();
		step = 3;
	}

	//methods to support step 6
	function find_smallest(minval)
	{
		for (var r = 0; r < nrow; r++)
			for (var c = 0; c < ncol; c++)
				if (RowCover[r] == 0 && ColCover[c] == 0)
					if (minval > C[r][c])
						minval = C[r][c];
		return minval;
	}

	//Add the value found in Step 4 to every element of each covered row, and subtract 
	//it from every element of each uncovered column.  Return to Step 4 without 
	//altering any stars, primes, or covered lines.
	function step_six()
	{
		var minval = Number.POSITIVE_INFINITY;
		minval = find_smallest(minval);
		for (var r = 0; r < nrow; r++)
			for (var c = 0; c < ncol; c++)
			{
				if (RowCover[r] == 1)
					C[r][c] += minval;
				if (ColCover[c] == 0)
					C[r][c] -= minval;
			}
		step = 4;
	}

	function step_seven()
	{
		//console.log("---------Run Complete----------");
	}

	function genRandomMatrix()
	{
		C[0][0] = Math.floor(Math.random()*100);
		for (var r = 0; r < nrow; r++)
			for (var c = 0; c < ncol; c++)
				C[r][c] = Math.floor(Math.random()*100);
		resetMaskandCovers();
	}

	function genTestMatrix()
	{
		for (var r = 0; r < nrow; r++)
			for (var c = 0; c < ncol; c++)
				C[r][c] = (r + 1) * (c + 1);
		resetMaskandCovers();
	}

	/* //unported function
	private static void InitMunkres()
	{
		string fname;
		string cmat;

		Console.Write("Enter file name (or press enter to generate test matrix)...");
		fname = Console.ReadLine();
		if (fname.Length > 0)
			loadMatrix(fname);
		else
		{
			Console.Write("Enter nrow....");
			nrow = Convert.ToInt32(Console.ReadLine());
			Console.Write("Enter ncol....");
			ncol = Convert.ToInt32(Console.ReadLine());
			Console.Write("Enter 1 for rnd matrix, enter 2 for c(i,j)=i*j [test] matrix...");
			cmat = Console.ReadLine();
			if (cmat == "1")
			{
				genRandomMatrix();
			}
			else
			{
				genTestMatrix();
			}
		}
		step = 1;
	}*/

	function RunMunkres()
	{
		var done = false;
		step = 1;
		for( var i=0; i<max_iteration && !done; i++)
		{
			//ShowCostMatrix();
			//ShowMaskMatrix();
			switch (step)
			{
				case 1:
					step_one();
					break;
				case 2:
					step_two();
					break;
				case 3:
					step_three();
					break;
				case 4:
					step_four();
					break;
				case 5:
					step_five();
					break;
				case 6:
					step_six();
					break;
				case 7:
					step_seven();
					done = true;
					break;
			}
		}
		if( i>=max_iteration)
			console.log('hungarian: trapped');
	}

	function ShowMatrix(C)
	{
		if( debug) 
		for (var r = 0; r < nrow; r++)
		{
			var str = '';
			for (var c = 0; c < ncol; c++)
				str += C[r][c]+' ';
			console.log(str);
		}
	}

	/*function Main()
	{
		InitMunkres();
		RunMunkres();
	}*/
}

/** given two sets A and B and a cost function,
	use Hungarian algorithm to compute the optimal assignment,
	and return the pairs.
	A and B do not need to be of the same size. in such case,
		some elements (from the larger set) will not be paired.
 */
function optimal_assignment(A,B,cost)
{
	var cost_matrix = generate_cost_matrix(A,B,cost);
	var assign = hungarian(cost_matrix,true);
	var pairs = pair_from_assignment_matrix(A,B,assign);
	//var total_cost = assignment_cost(cost_matrix,pairs);
	return pairs;
}

/** given two sets A and B and a cost function,
	generate the cost matrix
*/
function generate_cost_matrix(A,B,cost)
{
	var M = new Array(A.length);
	for( var i=0; i<A.length; i++)
	{
		M[i] = new Array(B.length);
		for( var j=0; j<B.length; j++)
		{
			M[i][j] = cost(A[i],B[j]);
		}
	}
	return M;
}

/** give an assignment matrix,
	return the assigned pairs in form of
	[[i1,j1],[i2,j2],,,]
	where i and j are indices of A and B respectively
*/
function pair_from_assignment_matrix(A,B,C)
{
	var corr=[];
	for( var i=0; i<C.length; i++)
	{
		for( var j=0; j<C[i].length; j++)
			if( C[i][j]===1 && //search for the 1
				i<A.length && j<B.length) //element must exists
			{
				corr.push([i,j]);
				break;
			}
	}
	return corr;
}

/** give an assignment matrix,
	return the assigned pairs in form of
	[[i1,j1],[i2,j2],,,]
	where i and j are n-th-element of A and B respectively
*/
function obj_pair_from_assignment_matrix(A,B,C)
{
	var corr=[];
	for( var i=0; i<C.length; i++)
	{
		for( var j=0; j<C[i].length; j++)
			if( C[i][j]===1 && //search for the 1
				i<A.length && j<B.length) //element must exists
			{
				corr.push([A[i],B[j]]);
				break;
			}
	}
	return corr;
}

function assignment_cost(cost_matrix,pairs)
{
	var cost=0;
	for( var i=0; i<pairs.length; i++)
	{
		var a = pairs[i][0],
			b = pairs[i][1];
		cost+=cost_matrix[a][b];
	}
	return cost;
}