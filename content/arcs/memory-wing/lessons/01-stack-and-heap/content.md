# The Stack and the Heap

*Logbook: "Every variable you've written so far has lived in the same place, and you never had to think about it. That ends here — from now on, where a value lives matters as much as what it holds."*

A running C program has (at minimum) two regions of memory it uses for your data: the **stack** and the **heap**. Everything you've written up to now has lived on the stack, automatically, without you asking for it. That's about to change.

## The stack: automatic and short-lived

Every time a function is called, the system pushes a **stack frame** for it — space for its parameters and local variables. When the function returns, that frame is popped and the memory is reclaimed, instantly, with no work on your part. This is why it's called *automatic* storage: you never allocate it and you never free it, the call/return mechanism does both for you.

```c
int square(int n) {
    int result = n * n;   // 'result' lives on the stack
    return result;
}                          // the moment this returns, 'result' is gone
```

The stack is fast — pushing and popping a frame is just moving a pointer — but it has two hard limits: it's usually fairly small (often a few megabytes), and a variable's lifetime is tied directly to the function call that created it. Once `square` returns, `result`'s memory no longer belongs to anyone. Trying to use a pointer to it after that is a bug you'll meet directly in a later lesson.

## The heap: manual and long-lived

The **heap** is a much larger pool of memory that isn't tied to any particular function call. Nothing goes there automatically — you have to explicitly ask for heap memory (with `malloc`, coming up in a few lessons) and explicitly give it back (with `free`) when you're done. In exchange for that manual bookkeeping, heap memory survives exactly as long as you want it to: it can outlive the function that created it, get handed off to other parts of your program, and persist for the entire run of the program if needed.

## Why C makes you choose

Higher-level languages hide this distinction — a garbage collector figures out when something's no longer needed and reclaims it for you. C doesn't have one. That's not an oversight; it's the trade C makes for being fast and predictable enough to write an operating system in. You get precise control over memory and zero hidden overhead, and in exchange, C trusts you to keep track of it yourself. The rest of this wing is about earning that trust.
