package com.xiangqi.game;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000>\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u0011\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u000f\b\u0007\u0018\u00002\u00020\u0001B\u0005\u00a2\u0006\u0002\u0010\u0002J\u0006\u0010\n\u001a\u00020\u0000J8\u0010\u000b\u001a,\u0012(\u0012&\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\u0004\u0012\u0004\u0012\u00020\u00040\r\u0012\u0010\u0012\u000e\u0012\u0004\u0012\u00020\u0004\u0012\u0004\u0012\u00020\u00040\r0\r0\f2\u0006\u0010\u000e\u001a\u00020\u000fJ\u0018\u0010\u0010\u001a\u0004\u0018\u00010\u00072\u0006\u0010\u0011\u001a\u00020\u00042\u0006\u0010\u0012\u001a\u00020\u0004J\b\u0010\u0013\u001a\u00020\u0014H\u0002J\u001e\u0010\u0015\u001a\u00020\u00162\u0006\u0010\u0011\u001a\u00020\u00042\u0006\u0010\u0012\u001a\u00020\u00042\u0006\u0010\u000e\u001a\u00020\u000fJ.\u0010\u0017\u001a\u00020\u00162\u0006\u0010\u0018\u001a\u00020\u00042\u0006\u0010\u0019\u001a\u00020\u00042\u0006\u0010\u001a\u001a\u00020\u00042\u0006\u0010\u001b\u001a\u00020\u00042\u0006\u0010\u000e\u001a\u00020\u000fJ&\u0010\u001c\u001a\u00020\u00162\u0006\u0010\u0018\u001a\u00020\u00042\u0006\u0010\u0019\u001a\u00020\u00042\u0006\u0010\u001a\u001a\u00020\u00042\u0006\u0010\u001b\u001a\u00020\u0004J&\u0010\u001d\u001a\u00020\u00162\u0006\u0010\u0018\u001a\u00020\u00042\u0006\u0010\u0019\u001a\u00020\u00042\u0006\u0010\u001a\u001a\u00020\u00042\u0006\u0010\u001b\u001a\u00020\u0004J.\u0010\u001e\u001a\u00020\u00162\u0006\u0010\u0018\u001a\u00020\u00042\u0006\u0010\u0019\u001a\u00020\u00042\u0006\u0010\u001a\u001a\u00020\u00042\u0006\u0010\u001b\u001a\u00020\u00042\u0006\u0010\u000e\u001a\u00020\u000fJ&\u0010\u001f\u001a\u00020\u00162\u0006\u0010\u0018\u001a\u00020\u00042\u0006\u0010\u0019\u001a\u00020\u00042\u0006\u0010\u001a\u001a\u00020\u00042\u0006\u0010\u001b\u001a\u00020\u0004J.\u0010 \u001a\u00020\u00162\u0006\u0010\u0018\u001a\u00020\u00042\u0006\u0010\u0019\u001a\u00020\u00042\u0006\u0010\u001a\u001a\u00020\u00042\u0006\u0010\u001b\u001a\u00020\u00042\u0006\u0010\u000e\u001a\u00020\u000fJ&\u0010!\u001a\u00020\u00162\u0006\u0010\u0018\u001a\u00020\u00042\u0006\u0010\u0019\u001a\u00020\u00042\u0006\u0010\u001a\u001a\u00020\u00042\u0006\u0010\u001b\u001a\u00020\u0004J.\u0010\"\u001a\u00020\u00162\u0006\u0010\u0018\u001a\u00020\u00042\u0006\u0010\u0019\u001a\u00020\u00042\u0006\u0010\u001a\u001a\u00020\u00042\u0006\u0010\u001b\u001a\u00020\u00042\u0006\u0010\u000e\u001a\u00020\u000fJ&\u0010#\u001a\u00020\u00162\u0006\u0010\u0018\u001a\u00020\u00042\u0006\u0010\u0019\u001a\u00020\u00042\u0006\u0010\u001a\u001a\u00020\u00042\u0006\u0010\u001b\u001a\u00020\u0004J\u0006\u0010$\u001a\u00020\u0014R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082D\u00a2\u0006\u0002\n\u0000R\u001e\u0010\u0005\u001a\u0010\u0012\f\u0012\n\u0012\u0006\u0012\u0004\u0018\u00010\u00070\u00060\u0006X\u0082\u0004\u00a2\u0006\u0004\n\u0002\u0010\bR\u000e\u0010\t\u001a\u00020\u0004X\u0082D\u00a2\u0006\u0002\n\u0000\u00a8\u0006%"}, d2 = {"Lcom/xiangqi/game/Board;", "", "()V", "cols", "", "grid", "", "Lcom/xiangqi/game/Piece;", "[[Lcom/xiangqi/game/Piece;", "rows", "clone", "getAllPossibleMoves", "", "Lkotlin/Pair;", "side", "Lcom/xiangqi/game/Side;", "getPiece", "row", "col", "initializeBoard", "", "isInPalace", "", "isValidAdvisorMove", "fromRow", "fromCol", "toRow", "toCol", "isValidCannonMove", "isValidChariotMove", "isValidElephantMove", "isValidHorseMove", "isValidKingMove", "isValidMove", "isValidPawnMove", "movePiece", "printBoard", "app_debug"})
public final class Board {
    private final int rows = 10;
    private final int cols = 9;
    @org.jetbrains.annotations.NotNull()
    private final com.xiangqi.game.Piece[][] grid = null;
    
    public Board() {
        super();
    }
    
    private final void initializeBoard() {
    }
    
    /**
     * Kiểm tra ô có nằm trong cung tướng không
     */
    public final boolean isInPalace(int row, int col, @org.jetbrains.annotations.NotNull()
    com.xiangqi.game.Side side) {
        return false;
    }
    
    /**
     * Kiểm tra nước đi hợp lệ cho Tướng
     */
    public final boolean isValidKingMove(int fromRow, int fromCol, int toRow, int toCol, @org.jetbrains.annotations.NotNull()
    com.xiangqi.game.Side side) {
        return false;
    }
    
    /**
     * Lấy quân cờ tại vị trí
     */
    @org.jetbrains.annotations.Nullable()
    public final com.xiangqi.game.Piece getPiece(int row, int col) {
        return null;
    }
    
    /**
     * Di chuyển quân cờ
     */
    public final boolean movePiece(int fromRow, int fromCol, int toRow, int toCol) {
        return false;
    }
    
    /**
     * In bàn cờ (debug)
     */
    public final void printBoard() {
    }
    
    /**
     * Sao chép bàn cờ
     */
    @org.jetbrains.annotations.NotNull()
    public final com.xiangqi.game.Board clone() {
        return null;
    }
    
    /**
     * Kiểm tra nước đi hợp lệ cho Tốt
     */
    public final boolean isValidPawnMove(int fromRow, int fromCol, int toRow, int toCol, @org.jetbrains.annotations.NotNull()
    com.xiangqi.game.Side side) {
        return false;
    }
    
    /**
     * Kiểm tra nước đi hợp lệ cho Pháo
     */
    public final boolean isValidCannonMove(int fromRow, int fromCol, int toRow, int toCol) {
        return false;
    }
    
    /**
     * Kiểm tra nước đi hợp lệ cho Xe
     */
    public final boolean isValidChariotMove(int fromRow, int fromCol, int toRow, int toCol) {
        return false;
    }
    
    /**
     * Kiểm tra nước đi hợp lệ cho Mã
     */
    public final boolean isValidHorseMove(int fromRow, int fromCol, int toRow, int toCol) {
        return false;
    }
    
    /**
     * Kiểm tra nước đi hợp lệ cho Tượng
     */
    public final boolean isValidElephantMove(int fromRow, int fromCol, int toRow, int toCol, @org.jetbrains.annotations.NotNull()
    com.xiangqi.game.Side side) {
        return false;
    }
    
    /**
     * Kiểm tra nước đi hợp lệ cho Sĩ
     */
    public final boolean isValidAdvisorMove(int fromRow, int fromCol, int toRow, int toCol, @org.jetbrains.annotations.NotNull()
    com.xiangqi.game.Side side) {
        return false;
    }
    
    /**
     * Liệt kê tất cả nước đi hợp lệ của một bên
     */
    @org.jetbrains.annotations.NotNull()
    public final java.util.List<kotlin.Pair<kotlin.Pair<java.lang.Integer, java.lang.Integer>, kotlin.Pair<java.lang.Integer, java.lang.Integer>>> getAllPossibleMoves(@org.jetbrains.annotations.NotNull()
    com.xiangqi.game.Side side) {
        return null;
    }
    
    /**
     * Kiểm tra nước đi hợp lệ cho một quân cờ
     */
    public final boolean isValidMove(int fromRow, int fromCol, int toRow, int toCol) {
        return false;
    }
}