# The Toolchain Awakens

You're about to write your first line of C. Before you do, it's worth understanding what happens to that line between you typing it and a CPU actually executing it — because unlike a lot of languages you may have brushed against, **C code doesn't run**. It gets *turned into* something that runs, in four distinct stages.

## The four stages

**1. Preprocessing.** Before anything is understood as C, a text-substitution pass runs over your file. It handles everything starting with `#` — `#include`, `#define`, and friends — literally pasting in file contents and replacing macros with their definitions. The output is still C, just expanded.

**2. Compiling.** The compiler proper reads that expanded C, checks it makes sense (this is where most of your early error messages come from), and translates it into **assembly language** — a human-readable-ish text form of the actual instructions a specific CPU understands.

**3. Assembling.** The assembler turns that assembly text into **object code** — real machine instructions, in binary, but not yet a runnable program. It's missing pieces: calls to functions like `printf` that live somewhere else.

**4. Linking.** The linker takes your object code and stitches in everything it depends on — the C standard library, any other object files — resolving every function call to an actual address, and produces the final executable.

Run all four stages together and that's what the command `gcc source.c -o program` is quietly doing for you in one shot.

## Why bother with all that, instead of just running the text?

Some languages — Python, JavaScript — are interpreted: something reads your source and executes it line by line, every time, translating on the fly. That's flexible, but it costs speed on every single run.

C compiles once, ahead of time, straight down to the native instructions of a specific CPU. There's no translator running alongside your program while it executes — just the CPU, executing real machine code. That's a large part of why C has stayed the language of choice for operating systems and anything performance-critical for over fifty years: the compiler does the expensive translation work exactly once, not on every run.

You won't need to think about these four stages consciously most days. But when a program fails to build, knowing *which stage* failed — compile error versus link error — tells you immediately what kind of problem you're looking at. That's a skill the next lesson starts building directly.
