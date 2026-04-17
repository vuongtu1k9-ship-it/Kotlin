package chess;

import androidx.compose.runtime.Composable;
import androidx.compose.ui.Modifier;
import androidx.compose.ui.graphics.drawscope.DrawScope;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000\u001c\n\u0000\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\u001a\b\u0010\u0000\u001a\u00020\u0001H\u0007\u001a\u0010\u0010\u0002\u001a\u00020\u00032\u0006\u0010\u0004\u001a\u00020\u0005H\u0002\u001a\f\u0010\u0006\u001a\u00020\u0001*\u00020\u0007H\u0002\u001a\u0014\u0010\b\u001a\u00020\u0001*\u00020\u00072\u0006\u0010\u0004\u001a\u00020\u0005H\u0002\u00a8\u0006\t"}, d2 = {"ChessView", "", "isGameOver", "", "board", "Lchess/Board;", "drawBoard", "Landroidx/compose/ui/graphics/drawscope/DrawScope;", "drawPieces", "app_debug"})
public final class ChessViewKt {
    
    /**
     * Composable để vẽ bàn cờ và quân cờ.
     */
    @androidx.compose.runtime.Composable()
    public static final void ChessView() {
    }
    
    /**
     * Kiểm tra trò chơi kết thúc chưa (tướng bị ăn).
     */
    private static final boolean isGameOver(chess.Board board) {
        return false;
    }
    
    /**
     * Vẽ bàn cờ.
     */
    private static final void drawBoard(androidx.compose.ui.graphics.drawscope.DrawScope $this$drawBoard) {
    }
    
    /**
     * Vẽ các quân cờ.
     * @param board Bàn cờ chứa các quân cờ.
     */
    private static final void drawPieces(androidx.compose.ui.graphics.drawscope.DrawScope $this$drawPieces, chess.Board board) {
    }
}