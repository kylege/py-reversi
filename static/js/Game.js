var chess_svg = d3.select('#chess-grid').append('svg:svg')
					.attr('width', 420).attr('height', 420);
//棋盘边界margin
var out_width = 10;
// 每个格子多宽
var cell_width = 50;
var row_count = 8;
var col_count = 8;
// 棋子大小
var piece_width = 46;

var chess_is_init = true;  //棋盘是不是没有走动过，如果没走动，他人上线就不用重画
//不同颜色棋子数量
var pieces_count_his = 2;
var pieces_count_my = 2;
var offline_timeout;
/**
 * 画8x8的棋盘
 * @return {bool} 
 */
function drawChessGrid(){
	var linecolor = 'rgb(0,0,0)';
	var bgcolor = '#DCEAF4';
	for (i=0; i<= row_count; i++){
		var rowline = [[out_width, out_width+i*cell_width], [out_width+row_count*cell_width, out_width+i*cell_width]];
		var colline = [[out_width+i*cell_width,out_width], [out_width+i*cell_width, out_width+row_count*cell_width]];
		var lines = [rowline, colline];
		for (j=0; j<2; j++){
			var line = lines[j];
			var myLine = chess_svg.append("svg:line")
			    .attr("x1", line[0][0])
			    .attr("y1", line[0][1])
			    .attr("x2", line[1][0])
			    .attr("y2", line[1][1])
			    .style("stroke", linecolor)
			    .style("stroke-width", 1)
			    .attr('class', 'shape-render');
		}		
	}
	// 初始棋子数据
	for(var i=0; i<row_count; i++){
	    Reversi.Pieces[i] = new Array();
	    for(j=0; j<col_count; j++){
	        Reversi.Pieces[i][j] = 0;
	    }
	}
	drawPiece(4,4,2);
	drawPiece(4,5,1);
	drawPiece(5,4,1);
	drawPiece(5,5,2);
}
/**
 * 在第几行几列的位置上画棋子
 * @param  {int} row  从1开始
 * @param  {int} col  从1开始
 * @return {bool}     
 */
function drawPiece(row, col, color){
	var key = 'piece-'+row+'-'+col;
	row = row-1;
	col = col-1;
	var dx = out_width + col*cell_width + (cell_width-piece_width)/2;
	var dy = out_width + row*cell_width + (cell_width-piece_width)/2;
	var imgurl = piece_imgs[color-1];
	chess_svg.append('svg:image')
    	.attr('width', piece_width)
    	.attr('height', piece_width)
    	.attr('xlink:href', imgurl)
    	.attr('x', dx)
    	.attr('y', dy)
    	.attr('id', key);
    Reversi.Pieces[row][col] = color;
}

/**
 * 获取当前坐标属于棋盘中的第几行几列
 * @param  {} pos 
 * @return {}     
 */
function getGridRowCol(pos){
    var cursorx = pos[0];
    var cursory = pos[1];
    var start_col = Math.ceil((cursorx-out_width) / cell_width);
    var start_row = Math.ceil((cursory-out_width) / cell_width);
    if(start_row < 0 ) start_row = 0;
    if(start_col < 0) start_col = 0;
    if(start_row > row_count) start_row = row_count;
    if(start_col > col_count) start_col = col_count;
    return [start_row, start_col]
}

/**
 * 获取鼠标当前在棋盘里面的相对坐标
 * @param  {} e 
 * @return {}   
 */
function getCurPosition(e) {  
    var x, y; 
    if (e.pageX != undefined && e.pageY != undefined) {  
      x = e.pageX;
      y = e.pageY; 
    } else {  
      x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
      y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }  
    x -= $(chess_svg[0][0]).offset().left;  //兼容firefox
    y -= $(chess_svg[0][0]).offset().top;
    return [x, y];
} 

/**
 * 选中棋子
 * @param  {event} e 
 * @return {bool}   
 */
function gameClickHandler(e){
	if(is_waiting){
        return false;
    }
	var pos = getCurPosition(e);
	var rowcol = getGridRowCol(pos);
    var row = rowcol[0];
    var col = rowcol[1];
    if(Reversi.Pieces[row-1][col-1] > 0){
    	return false;
    }
    var reversi = new Reversi(row, col, my_piece_color);
    reversi.findReversiPieces();
    if(reversi.can_put_piece){
    	drawPiece(row, col, my_piece_color);
    	reversi.doReversePieces();
    	gamemove(row, col);
    }
};

//哪一方该下棋的标记
function initStartSign(){
    $('#piece_sign_top').removeClass('gamemove-status');
    $('#piece_sign_bottom').removeClass('gamemove-status');
    var piece_signs = $('#piece_sign_top');
    if(my_piece_color == 1){
        piece_signs = $('#piece_sign_bottom');   
    }
    piece_signs.addClass('gamemove-status');
}
/**
 * 发送聊天
 * @return {} 
 */
function sendchat(){
    var content = $('#chat-input').val();
    $('#chat-input').val('');            
    if (!content || room_status != 1) return;
    $('#chat-div ul').append('<li class="mychat-li"></li>');
    $('#chat-div ul li:last-child').text(content);
    $('#chat-div ul').scrollTop($('#chat-div ul')[0].scrollHeight);
    gamesocket.send(JSON.stringify({
        room: room_name,
        content: content,
        'type':'on_chat',
    }));
}
/**
 * 下棋动作
 * @param  {array} from 
 * @param  {array} to
 * @return {bool}     
 */
function gamemove(row, col){
    chess_is_init = false;
    var data = JSON.stringify({
        room: room_name,
        row: row,
        col: col,
        'type':'on_gamemove',
    });
    gamesocket.send(data);

    var he_can_put = false;
    for(var i=1; i<=row_count; i++){
        for(var j=1; j<=col_count; j++){
            if(Reversi.Pieces[i-1][j-1] == 0){
                var reversi = new Reversi(i, j, his_piece_color);
                reversi.findReversiPieces();
                if(reversi.can_put_piece){ 
                    he_can_put = true;
                    break;
                }
            }
        }
    }
    if(he_can_put){  //如果对方可以下，则禁自己下，否则，自己继续下
        is_waiting = true;
        d3.select('#chess-grid svg').style('cursor','default')
        $('#piece_sign_bottom').removeClass('gamemove-status');
        $('#piece_sign_top').addClass('gamemove-status');
    }

    renderPiecesCount();
}
/**
 * 对方离线
 * @param  {string} msg 
 * @return {bool}     
 */
function on_offline(msg){
    is_waiting = true;
    room_status = 0;
    $('#status-span').text('对方离线');
    $('#game-canvas').css('cursor', 'default');
    $('#piece_sign_top').removeClass('gamemove-status');
    $('#piece_sign_bottom').removeClass('gamemove-status');
    $('#alert-title').text('对方离线');
    offline_timeout = setTimeout(function(){
       $('#alert-model-dom').data('id', 0).modal('show');
    }, 2000);
}
/**
 * 对方走一步棋
 * @param  {string} msg 
 * @return {bool}     
 */
function on_gamemove(msg){
    chess_is_init = false;
    row = parseInt(msg.row);
    col = parseInt(msg.col);

    var reversi = new Reversi(row, col, his_piece_color);
    reversi.findReversiPieces();
    if(reversi.can_put_piece){
    	drawPiece(row, col, his_piece_color);
    	reversi.doReversePieces();
    }

    var i_can_put = false;
    for(var i=1; i<=row_count; i++){
        for(var j=1; j<=col_count; j++){
            if(Reversi.Pieces[i-1][j-1] == 0){
                var reversi = new Reversi(i, j, my_piece_color);
                reversi.findReversiPieces();
                if(reversi.can_put_piece){ 
                    i_can_put = true;
                    break;
                }
            }
        }
    }
    if(i_can_put){  //如果我可以下，则自己下
        d3.select('#chess-grid svg').style('cursor','pointer');
        $('#piece_sign_top').removeClass('gamemove-status');
        $('#piece_sign_bottom').addClass('gamemove-status');
        is_waiting = false;
    }

    renderPiecesCount();
}
/**
 * 开始游戏
 * @param  {string} msg 
 * @return {bool}     
 */
function on_gamestart(msg){
    clearTimeout(offline_timeout);
    is_waiting = (my_piece_color==2) ? true : false;
    room_status = 1;
    $('#status-span').text('对方上线，游戏开始');

    if(!chess_is_init){
        d3.selectAll('#chess-grid svg *').remove();
        drawChessGrid();  //重画棋盘
    }

    $('#his_status_img').attr('src', status_imgs[his_piece_color-1]);
    $('#my_status_img').attr('src', status_imgs[my_piece_color-1]);

    if(my_piece_color == 1){  //黑先白后
        $('#chess-grid svg').css('cursor', 'pointer');
    }else{
        $('#chess-grid svg').css('cursor', 'default');
    }
    initStartSign();
}
/**
 * 游戏结束
 * @param  {string} msg 
 * @return {bool}     
 */
function on_gameover(msg){
    is_waiting = true;
    room_status = 2;
    $('#status-span').text('游戏结束');
    $('#piece_sign_top').removeClass('gamemove-status');
    $('#piece_sign_bottom').removeClass('gamemove-status');
    $('#chess-grid svg').css('cursor', 'default'); 

    $('#alert-title').text('游戏结束');
    $('#alert-model-dom').data('id', 0).modal('show');
}
/**
 * 聊天
 * @param  {string} msg 
 * @return {bool}     
 */
function on_chat(msg){
    $('#chat-div ul').append('<li class="hischat-li"></li>');
    $('#chat-div ul li:last-child').text(msg.content);
    $('#chat-div ul').scrollTop($('#chat-div ul')[0].scrollHeight);
}
/**
 * 计算各颜色棋子数量，并显示出来
 * @return {bool} 
 */
function renderPiecesCount(){
    var count_black = 0;
    var count_white = 0;
    for (var i = row_count - 1; i >= 0; i--) {
        for (var j = col_count - 1; j >= 0; j--) {
            if (Reversi.Pieces[i][j] == 1){
                count_black++;
            }else if(Reversi.Pieces[i][j] == 2){
                count_white++;
            }
        };
    };
    var counts = [ count_black, count_white];
    var his_piece_count = counts[his_piece_color-1];
    var my_piece_count = counts[my_piece_color-1];

    var duration = 1000;

    d3.select('#his_piece_count')
      .text(pieces_count_his)
      .transition()
      .duration(duration)
      .ease('linear')
      .tween("text", function() {
        var i = d3.interpolate(this.textContent, his_piece_count);
        return function(t) {
          this.textContent = Math.round(i(t));
        };
    });

    d3.select('#my_piece_count')
      .text(pieces_count_my)
      .transition()
      .duration(duration)
      .ease('linear')
      .tween("text", function() {
        var i = d3.interpolate(this.textContent, my_piece_count);
        return function(t) {
          this.textContent = Math.round(i(t));
        };
    });
    pieces_count_his = his_piece_count;
    pieces_count_my = my_piece_count;
}

window.onbeforeunload = function () {
    gamesocket.close();
    // event.returnValue = "You will lose any unsaved content";
}

$(function() {

	drawChessGrid();

	chess_svg[0][0].addEventListener("click", gameClickHandler, false);

	if(room_status != 0){
        initStartSign();
    }
    if(is_waiting ){
        $('#chess-grid svg').css('cursor', 'default');
    }

    var WebSocket = window.WebSocket || window.MozWebSocket;
        if (WebSocket) {
            try {
                gamesocket = new WebSocket(wsurl);
            } catch (e) {
                alert(e)
            }
    }

    if (gamesocket) {
        gamesocket.onopen = function(){  
            //gamesocket.send(JSON.stringify({name:"yes"}));
        }  
        gamesocket.onmessage = function(event) {
            // console.log(event.data);
            var msg = JSON.parse(event.data)
            switch(msg.type){
                case 'online':
                    on_online(msg);
                    break;
                case 'offline':
                    on_offline(msg);
                    break;
                case 'on_gamestart':
                    on_gamestart(msg);
                    break;
                case 'on_gamemove':
                    on_gamemove(msg);
                    break;
                case 'on_gameover':
                    on_gameover(msg);
                    break;
                case 'on_chat':
                    on_chat(msg);
                    break;
                default:
                    break;
            }
        }
    }

});