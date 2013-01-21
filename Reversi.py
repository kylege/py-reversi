#encoding=utf-8

class BasicReturn():

    def __init__(self, result=True, code=0, msg='', data=None):
        self.result = result
        self.code = code
        self.msg = msg
        self.data = data

class ChessGame():
    row_count = 8

    def __init__(self):
        self.last_move_color = None
        self.isGameOver = False
        ''' 棋子8x8(行x列)数组，值为1表示黑棋，2表示白棋, 0表示没有棋子'''
        self.PiecesMap = []       
        self.PiecesMap = [([0] * ChessGame.row_count) for i in range(ChessGame.row_count)]
        self.PiecesMap[3][3] = 2
        self.PiecesMap[3][4] = 1
        self.PiecesMap[4][3] = 1
        self.PiecesMap[4][4] = 2

        self.reversi_pieces = []  #能够被翻转的棋子位置数组
        self.can_put_piece = False  #能否在此位置放置棋子

    '''具体下棋函数，在row行col列放color颜色的棋子'''
    def putPiece(self, row, col, color):
    	if self.last_move_color == color:
    		return BasicReturn(False, -1, '对方还没走棋')
    	if self.PiecesMap[row-1][col-1] != 0:
    		return BasicReturn(False,-1,'该位置已有棋子')
    	if not self._findReversiPieces(row, col, color):
    		return BasicReturn(False,-1,'走法不合规则')

    	self._doReversePieces()
    	self.PiecesMap[row-1][col-1] = color
    	self.last_move_color = color
    	
    	return BasicReturn(True)


    '''找出当前下棋位置，所有需要翻转的棋子坐标，存到reversi_pieces里面
        row,col 在哪行哪列下color颜色的棋子
    '''
    def _findReversiPieces(self, row, col, color):
        self.row = row
        self.col = col
        self.color = color
        self.his_color = 2 if color == 1 else 1
        self.reversi_pieces = []
        self._findReversiPieces_direction(-1,0)    #向上走
        self._findReversiPieces_direction(1,0)     #向下走
        self._findReversiPieces_direction(0,-1)    #向左走
        self._findReversiPieces_direction(0,1)     #向右走
        self._findReversiPieces_direction(-1,-1)   #左上走
        self._findReversiPieces_direction(1,1)     #右下走
        self._findReversiPieces_direction(1,-1)    #右上走
        self._findReversiPieces_direction(-1,1)    #左下走
        if len(self.reversi_pieces) > 0:
            self.can_put_piece = True
            return True
        else:
            self.can_put_piece = False
            return False

    '''查看对方是否还有棋子可走，游戏是否结束'''
    def checkGameOver(self):
    	for i in range(ChessGame.row_count):
    		for j in range(ChessGame.row_count):
    			if self.PiecesMap[i][j] == 0:
    				if self._findReversiPieces(i+1, j+1, self.his_color):
    					self.isGameOver = False
    					return False
    	self.isGameOver = True
    	return True

    '''将找出来的可以翻转的棋子，翻转成对方颜色 紧接着findReversiPieces调用'''
    def _doReversePieces(self):
        if len(self.reversi_pieces) <= 0:
            return False
        for pos in self.reversi_pieces:
            self.PiecesMap[pos[0]][pos[1]] = self.color
        self.reversi_pieces = []
        return True

    ''' 从行列各个方向找能够被翻转的棋子
        row_direction 行方向，1表示加，-1表示减，0不变
        col_direction 列方向
    '''
    def _findReversiPieces_direction(self, row_direction, col_direction):
        temp_row = self.row
        temp_col = self.col
        reversi_pieces_temp = []
        while True:
            temp_row = temp_row + row_direction
            temp_col = temp_col + col_direction
            if temp_row <= 0 or temp_row > ChessGame.row_count or temp_col <= 0 or temp_col > ChessGame.row_count:
                break
            cur_piece = self.PiecesMap[temp_row-1][temp_col-1]
            if cur_piece == self.his_color:
                reversi_pieces_temp.append([temp_row-1, temp_col-1])
            elif cur_piece == self.color:
                if len(reversi_pieces_temp) > 0:
                    self.reversi_pieces.extend(reversi_pieces_temp)
                break
            else:       # 遇到空白才返回，说明没有遇到自己的颜色，没有夹住对方的颜色
                break


class GameRoom():
    STATUS_WAITING = 0;
    STATUS_GOING   = 1
    STATUS_END     = 2

    def __init__(self, room_name, piece_id):
        self.chess_game = ChessGame()
        self.status = self.STATUS_WAITING
        self.room_name = room_name
        self.user_piece_ids = set([piece_id])