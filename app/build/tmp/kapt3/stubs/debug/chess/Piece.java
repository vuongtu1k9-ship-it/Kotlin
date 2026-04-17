package chess;

/**
 * Lớp đại diện cho một quân cờ trong cờ tướng.
 * @property type Loại quân cờ.
 * @property color Màu sắc của quân cờ.
 * @property x Vị trí cột (0-8).
 * @property y Vị trí hàng (0-9).
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000,\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0012\n\u0002\u0010\u000b\n\u0002\b\u0004\n\u0002\u0010\u000e\n\u0000\b\u0087\b\u0018\u00002\u00020\u0001B%\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u0012\u0006\u0010\b\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\tJ\t\u0010\u0014\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0015\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0016\u001a\u00020\u0007H\u00c6\u0003J\t\u0010\u0017\u001a\u00020\u0007H\u00c6\u0003J1\u0010\u0018\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00072\b\b\u0002\u0010\b\u001a\u00020\u0007H\u00c6\u0001J\u0013\u0010\u0019\u001a\u00020\u001a2\b\u0010\u001b\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u001c\u001a\u00020\u0007H\u00d6\u0001J\u0006\u0010\u001d\u001a\u00020\u001aJ\t\u0010\u001e\u001a\u00020\u001fH\u00d6\u0001R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\n\u0010\u000bR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\rR\u001a\u0010\u0006\u001a\u00020\u0007X\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u000e\u0010\u000f\"\u0004\b\u0010\u0010\u0011R\u001a\u0010\b\u001a\u00020\u0007X\u0086\u000e\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u0012\u0010\u000f\"\u0004\b\u0013\u0010\u0011\u00a8\u0006 "}, d2 = {"Lchess/Piece;", "", "type", "Lchess/PieceType;", "color", "Lchess/PieceColor;", "x", "", "y", "(Lchess/PieceType;Lchess/PieceColor;II)V", "getColor", "()Lchess/PieceColor;", "getType", "()Lchess/PieceType;", "getX", "()I", "setX", "(I)V", "getY", "setY", "component1", "component2", "component3", "component4", "copy", "equals", "", "other", "hashCode", "isValid", "toString", "", "app_debug"})
public final class Piece {
    @org.jetbrains.annotations.NotNull()
    private final chess.PieceType type = null;
    @org.jetbrains.annotations.NotNull()
    private final chess.PieceColor color = null;
    private int x;
    private int y;
    
    @org.jetbrains.annotations.NotNull()
    public final chess.PieceType component1() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final chess.PieceColor component2() {
        return null;
    }
    
    public final int component3() {
        return 0;
    }
    
    public final int component4() {
        return 0;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final chess.Piece copy(@org.jetbrains.annotations.NotNull()
    chess.PieceType type, @org.jetbrains.annotations.NotNull()
    chess.PieceColor color, int x, int y) {
        return null;
    }
    
    @java.lang.Override()
    public boolean equals(@org.jetbrains.annotations.Nullable()
    java.lang.Object other) {
        return false;
    }
    
    @java.lang.Override()
    public int hashCode() {
        return 0;
    }
    
    @java.lang.Override()
    @org.jetbrains.annotations.NotNull()
    public java.lang.String toString() {
        return null;
    }
    
    public Piece(@org.jetbrains.annotations.NotNull()
    chess.PieceType type, @org.jetbrains.annotations.NotNull()
    chess.PieceColor color, int x, int y) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull()
    public final chess.PieceType getType() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull()
    public final chess.PieceColor getColor() {
        return null;
    }
    
    public final int getX() {
        return 0;
    }
    
    public final void setX(int p0) {
    }
    
    public final int getY() {
        return 0;
    }
    
    public final void setY(int p0) {
    }
    
    /**
     * Kiểm tra xem quân cờ có hợp lệ không.
     */
    public final boolean isValid() {
        return false;
    }
}