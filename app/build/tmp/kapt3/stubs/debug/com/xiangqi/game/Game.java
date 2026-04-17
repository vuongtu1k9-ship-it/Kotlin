package com.xiangqi.game;

@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00002\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0002\b\u0007\u0018\u00002\u00020\u0001B\u0005\u00a2\u0006\u0002\u0010\u0002J\u000e\u0010\t\u001a\u00020\n2\u0006\u0010\u000b\u001a\u00020\fJ\b\u0010\r\u001a\u00020\u000eH\u0002J\u0006\u0010\u000f\u001a\u00020\u000eR\u000e\u0010\u0003\u001a\u00020\u0004X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\bX\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0010"}, d2 = {"Lcom/xiangqi/game/Game;", "", "()V", "ai", "Lcom/xiangqi/game/XiangqiAI;", "board", "Lcom/xiangqi/game/Board;", "currentSide", "Lcom/xiangqi/game/Side;", "handleMove", "", "input", "", "makeAIMove", "", "start", "app_debug"})
public final class Game {
    @org.jetbrains.annotations.NotNull()
    private final com.xiangqi.game.Board board = null;
    @org.jetbrains.annotations.NotNull()
    private com.xiangqi.game.Side currentSide = com.xiangqi.game.Side.RED;
    @org.jetbrains.annotations.NotNull()
    private final com.xiangqi.game.XiangqiAI ai = null;
    
    public Game() {
        super();
    }
    
    public final void start() {
    }
    
    public final boolean handleMove(@org.jetbrains.annotations.NotNull()
    java.lang.String input) {
        return false;
    }
    
    /**
     * Tự động đưa ra nước đi cho AI
     */
    private final void makeAIMove() {
    }
}