# Capstone: Make It Fast

*Logbook, final entry for this vault: "Every room before this one taught you how to make a program correct. This one taught you what 'correct' is actually running on. That was always the harder half."*

Seven lessons ago this room started with a four-stage pipeline turning your C into an executable. Since then you've read your own compiler's output as real assembly, watched a stack frame get built and torn down, watched `-O2` prove a whole function call was unnecessary and delete it, measured a 19x gap between two loops that compute the exact same answer, learned to time code without lying to yourself, and watched undefined behavior get caught for real instead of taken on faith. This capstone asks for one last program that puts the memory-hierarchy lesson to work directly.

## The sensor grid

The lab's old sensor array reports readings into an 8×8 grid, and the restoration checklist wants a checksum — the sum of every reading. Write it so the inner loop walks each row in order (`j` as the inner loop index), matching C's actual row-major layout, exactly the access pattern Lesson 5 measured at roughly 19x faster than the alternative on a large grid. At 8×8 the difference is far too small to see (there just isn't enough data to make the cache miss), but the *shape* of the code is the same either way — and that shape is what actually matters once a grid is thousands of cells wide instead of dozens, which is the whole point of learning the technique on a small, easy-to-verify example instead of only on a big one you'd have to take on faith.

## Grading correctness, not speed

Every exercise in this lab is graded by running your compiled program and checking its output — there's no way for it to grade "did you write the cache-friendly version," only "did you print the right checksum." That's not a loophole; it's an honest limit of automated grading, and it's exactly why Lesson 6 taught you `clock_gettime` — nothing stops you from writing both the row-major and column-major versions of this exact program yourself, timing each one the way that lesson showed, and watching this room's central claim prove itself on your own machine, on your own hardware, with your own numbers. That's the only kind of evidence this room has ever actually trusted.
