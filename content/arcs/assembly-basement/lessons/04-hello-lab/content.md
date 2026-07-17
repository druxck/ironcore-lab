# Hello, Lab

Time to power something on for real. Here's a complete, correct C program — every line of it required:

```c
#include <stdio.h>

int main(void) {
    printf("Hello, lab.\n");
    return 0;
}
```

Nothing about this is decorative. Let's go through it line by line, because every piece is doing real work.

## `#include <stdio.h>`

You just learned the preprocessor pastes in file contents before compiling. This line pastes in declarations from the **standard I/O** header — it's what tells the compiler that a function called `printf` exists and what its signature looks like, before you use it. Without this line, the compiler has no idea what `printf` is.

## `int main(void)`

Every C program has exactly one designated starting point: a function named `main`. When your program runs, the operating system calls this function first. `int` means main *returns* an integer when it finishes. `(void)` means main takes no arguments in this version — you'll meet the version that accepts command-line arguments later.

## `printf("Hello, lab.\n");`

`printf` writes text to standard output — normally, your terminal. The `\n` inside the string isn't two characters, it's one: a newline **escape sequence**. Without it, whatever runs after your program would print immediately after "lab." with no line break.

Every statement in C ends with a semicolon `;`. It's not optional, and forgetting one is the single most common first mistake — you'll meet the compiler's opinion about that in the next lesson.

## `return 0;`

This ends `main`, and hands `0` back to the operating system as your program's **exit status**. By near-universal convention, `0` means "everything went fine." Any other value signals some kind of failure — you'll use this yourself later when a program needs to report an error.

## The braces

`{` and `}` mark the start and end of `main`'s body — everything the function actually does lives between them. Every opening brace needs a matching closing one; the compiler will not let you forget.

That's the whole shape of a C program: include what you need, define `main`, do something, return a status. Time to write your own.
