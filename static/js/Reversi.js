
/**
 * 棋子判断相关算法类
 * @param {int} row 第几行，从1开始
 * @param {int} col 第几列，从1开始
 * @param {int} color 棋子颜色，1黑2白
 */
var Reversi = function (row, col, color) {

	this.row = row;
	this.col = col;
	this.color = color;
	this.his_color = color == 1 ? 2 : 1;
	this.reversi_pieces = [];    //能够被翻转的棋子位置数组
	this.can_put_piece = false;  //能否在此位置放置棋子

	/**
	 * 找出当前下棋位置，所有需要翻转的棋子坐标，存到reversi_pieces里面
	 * @return 
	 */
	this.findReversiPieces = function(){
		this.reversi_pieces = [];
		this._findReversiPieces_direction(-1,0);  //向上走
		this._findReversiPieces_direction(1,0);   //向下走
		this._findReversiPieces_direction(0,-1);  //向左走
		this._findReversiPieces_direction(0,1);   //向右走
		this._findReversiPieces_direction(-1,-1); //左上走
		this._findReversiPieces_direction(1,1);   //右下走
		this._findReversiPieces_direction(1,-1);  //右上走
		this._findReversiPieces_direction(-1,1);  //左下走

		if (this.reversi_pieces.length > 0){
			this.can_put_piece = true;
		}else{
			this.can_put_piece = false;
		}
	}
	/**
	 * 将找出来的可以翻转的棋子，翻转成对方颜色
	 * @return {bool} 
	 */
	this.doReversePieces = function(){
		if(this.reversi_pieces.length <= 0){
			return false;
		}
		var my_piece_img = status_imgs[this.color-1];
		for (var i=0; i<this.reversi_pieces.length; i++){
			var pos = this.reversi_pieces[i];
			var row = pos[0]+1;
			var col = pos[1]+1;
			var id = 'piece-'+row+'-'+col;
			var startx = out_width + (col-1)*cell_width + (cell_width)/2;  //缩小到0时的x坐标
			var starty = out_width + (row-1)*cell_width + (cell_width)/2;
			var endx = out_width + (col-1)*cell_width + (cell_width-piece_width)/2;
			var endy = out_width + (row-1)*cell_width + (cell_width-piece_width)/2;
			d3.select('#'+id)
				.transition()
				.attr('width',0)
				.attr('height',0)
				.attrTween('x', function(d,i,a){
						return d3.interpolate(a, startx);
					})
				.attrTween('y', function(d,i,a){
						return d3.interpolate(a, starty);
					})
				.each("end",function() { 
					d3.select(this).attr('xlink:href', my_piece_img);  // 这里id已经变了
					d3.select(this)
						.transition()
						.attr('width',piece_width)
						.attr('height',piece_width)
						.attrTween('x', function(d,i,a){
								return d3.interpolate(a, endx);
							})
						.attrTween('y', function(d,i,a){
								return d3.interpolate(a, endy);
							})
				});
			Reversi.Pieces[pos[0]][pos[1]] = this.color;
		}
		this.reversi_pieces = [];
	}

	/**
	 * 从行列各个方向找能够被翻转的棋子
	 * @param  {int} row_direction 行方向，1表示加，-1表示减，0不变
	 * @param  {int} col_direction 列方向
	 * @return {bool}               
	 */
	this._findReversiPieces_direction = function(row_direction, col_direction){
		var temp_row = this.row;
		var temp_col = this.col;
		var reversi_pieces_temp = [];
		while(true){
			temp_row += row_direction;
			temp_col += col_direction;
			if(temp_row <= 0 || temp_row > row_count || temp_col <= 0 || temp_col > col_count){
				break;
			}
			var cur_piece = Reversi.Pieces[temp_row-1][temp_col-1];
			if(cur_piece == this.his_color){
				reversi_pieces_temp.push([temp_row-1, temp_col-1]);
			}else if(cur_piece == this.color){
				if(reversi_pieces_temp.length > 0){
					this.reversi_pieces = this.reversi_pieces.concat(reversi_pieces_temp);
				}
				break;
			}else{ //遇到空白才返回，说明没有遇到自己的颜色，没有夹住对方的颜色
				break;
			}
		}
	}
}

/**
 * 棋子8x8(行x列)数组，值为1表示黑棋，2表示白棋, 0表示没有棋子
 * @type array
 */
Reversi.Pieces = Array();