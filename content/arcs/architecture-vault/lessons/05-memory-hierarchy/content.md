# The Memory Hierarchy

*Logbook: "Same matrix, same math, same answer either way. One version of the loop was twenty times slower. The data didn't change. Only the order we walked through it did."*

RAM is not one uniform pool of equally-fast memory, no matter how C's `int arr[1000]` makes it look. Between the CPU and RAM sits a hierarchy: a handful of registers (instant), then L1 cache (tiny, a few dozen kilobytes, a couple cycles away), L2 (bigger, slower), often L3 (bigger still, slower still), and only then RAM itself - dozens to hundreds of times slower than a register. Every level below the top works in fixed-size chunks called **cache lines** (64 bytes on essentially every mainstream CPU): touch one byte, and the 64 bytes around it get pulled into cache together, on the bet that you'll want your neighbors next. Sequential access wins big because that bet keeps paying off. Scattered access loses big because it keeps being wrong - every touch is a different, uncached line.

## Why traversal order matters for a 2D array

C stores a 2D array **row-major**: `int matrix[N][N]` lays every element of row 0 in memory first, contiguously, then all of row 1 right after it, and so on. `matrix[i][j]` and `matrix[i][j+1]` are neighbors - 4 bytes apart. `matrix[i][j]` and `matrix[i+1][j]` are `N * 4` bytes apart - for a large matrix, almost certainly a different cache line, sometimes a different page entirely.

That means looping with `j` as the inner loop (row-major traversal) walks memory sequentially - cache-friendly. Looping with `i` as the inner loop (column-major traversal, against the grain of how C actually laid the data out) jumps a full row's width on every single access.

## Real numbers, not folklore

Same 2000×2000 `int` matrix, same summation, compiled identically, only the loop order swapped:

```
row-major: 0.62 ms
col-major: 12.04 ms
```

That's roughly **19x**, measured on this exact machine, not a textbook figure - run it yourself and you'll see it too (numbers wobble a little run to run; the gap doesn't). Nothing about *what* got computed changed - both loops touch the same elements and produce the exact same sum. Only *the order memory got touched in* changed, and that alone was the entire difference. This is the core lesson of this whole room: correctness and speed are separate questions, and speed is very often decided by facts about memory, not about your algorithm's cleverness.
