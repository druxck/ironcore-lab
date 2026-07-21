# The Stack Frame and the Calling Convention

*Logbook: "You can't see a stack frame with your eyes - no light down here shows it to you directly. But gdb can, and once you've counted a few real ones, you'll never think of a function call as 'instant' again."*

Last lesson you saw every function's prologue: `push %rbp; mov %rsp,%rbp`. That pair does one specific thing - it saves the *caller's* frame pointer on the stack, then makes the stack pointer the new frame pointer for the function that's currently running. Every function call, this happens again, stacked on top of the last one. That block - the saved frame pointer, the return address `call` pushed automatically before jumping here, and this function's own local variables - is a **stack frame**. A running program's call stack is just a chain of these, one per function call that hasn't returned yet.

## Watching the chain build, for real

Here's a small recursive program:

```c
#include <stdio.h>

void recurse(int n) {
    if (n == 0) {
        printf("bottom\n");
        return;
    }
    recurse(n - 1);
}

int main(void) {
    recurse(3);
    return 0;
}
```

Breakpoint on `recurse`, run, and let it hit that breakpoint four times (once for `n=3`, `2`, `1`, `0`) before asking gdb for a backtrace. This is the real, unedited transcript:

```
Breakpoint 1, recurse (n=0) at recurse.c:4
4	    if (n == 0) {
(gdb) bt
#0  recurse (n=0) at recurse.c:4
#1  0x000055555555523f in recurse (n=1) at recurse.c:8
#2  0x000055555555523f in recurse (n=2) at recurse.c:8
#3  0x000055555555523f in recurse (n=3) at recurse.c:8
#4  0x0000555555555257 in main () at recurse.c:12
```

Read `bt`'s output top to bottom as *innermost call first*: `#0` is wherever execution is stopped right now - the deepest, most recent call, `recurse(n=0)`. Each frame below it is the call that made the one above it happen, ending at `#4`, `main` itself, which started the whole chain. Five frames, because `recurse` was called four times (`n=3,2,1,0`) plus the one frame for `main` that kicked it off - every one of those still exists, fully intact, stacked on top of each other, for exactly as long as its call hasn't returned yet. That's not a metaphor; it's four literal, live blocks of stack memory, each holding its own copy of `n` (which is exactly why `#1` through `#3` correctly show different values of `n` even though they're all "the same function").

The address next to `#1`-`#3` (`0x...23f`) is the **return address** - the instruction each frame will jump back to once the call sitting above it returns. `#0` doesn't show one because it hasn't made a further call yet; there's nothing to return *to* below it in this snapshot.
