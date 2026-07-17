# The Heap: Borrowing Memory

Every array you've written so far had a size fixed at compile time — `int values[5]` reserves exactly 5 ints, forever, on the stack. Real programs often don't know how much memory they'll need until they're running: a file's length, a user's input, a number computed halfway through. That's what the heap is for, and `malloc` is how you ask for a piece of it.

## Asking for memory

```c
int *values = malloc(5 * sizeof(int));
```

`malloc` takes a number of **bytes** and returns a pointer to a block of at least that many bytes on the heap — or `NULL` if the system couldn't satisfy the request. Two details matter immediately:

- **Always compute the size with `sizeof`**, not a guessed number. `sizeof(int)` is however many bytes an `int` actually is on this machine (typically 4, but never assume) — `5 * sizeof(int)` reads as "room for 5 ints" regardless of platform.
- **`malloc` returns `void *`**, a generic pointer, which C converts to any other pointer type automatically. You do not need to (and shouldn't) write `(int *)malloc(...)` — that cast is a C++ habit that occasionally hides a real bug in C, where forgetting `#include <stdlib.h>` becomes a silent error instead of a loud one.

## Always check the return

If the system is out of memory, `malloc` returns `NULL` instead of crashing — it hands the problem back to you. Using a `NULL` pointer as if it were valid is exactly the bug from two lessons ago, so production code always checks first:

```c
int *values = malloc(5 * sizeof(int));
if (values == NULL) {
    fprintf(stderr, "out of memory\n");
    return 1;
}
```

You'll see this check in every serious C codebase. On this lab's small exercises you'll rarely see it actually fail — but the habit of checking is what separates code that fails loudly and immediately from code that fails mysteriously three functions later.

## Giving it back

```c
free(values);
```

`free` returns a block of heap memory to the system so it can be reused. This is the half of the deal `malloc` doesn't do for you automatically — nothing about the heap knows a block is "done" until you say so.

## The one rule that matters most

**Every successful `malloc` needs exactly one matching `free` — not zero, not two.** Forget the `free` entirely, and that memory is gone for the rest of the program's life: a **leak**. Call `free` twice on the same pointer, and you've corrupted the heap's own bookkeeping: a **double free**. Use the pointer *after* freeing it, and you're reading or writing memory that no longer belongs to you: a **dangling pointer**. All three are the subject of the next lesson, where you'll meet the tools built specifically to catch them.
