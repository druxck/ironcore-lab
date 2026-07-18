# From Source to Silicon

*Logbook: "Everyone down here called it 'the vault' because nothing you actually wrote ever ran directly. Every program went through four transformations before the machine would touch it. Nobody skipped a step — not even us."*

You've been running `gcc` since Assembly Basement, and it always looked like one step: source code in, running program out. It isn't. `gcc` is a driver program that quietly runs four separate stages, each one consuming the previous stage's output and producing a completely different kind of file. This room is about seeing those stages individually instead of taking the driver's word for it.

## The four stages

Take this tiny file:

```c
int add(int a, int b) {
    return a + b;
}

int main(void) {
    return add(3, 4);
}
```

**1. Preprocessing** expands `#include`, `#define`, and every other line starting with `#`, and strips comments. This file has none of those, so the preprocessor's output looks almost identical to the input — but on a real program with headers, this stage is where thousands of lines of declarations get pasted in before a single line of yours is even looked at.

```
$ gcc -E add.c -o add.i
$ file add.i
add.i: C source, ASCII text
```

**2. Compiling** turns preprocessed C into assembly — human-readable (if you squint) text in the target CPU's own instruction set:

```
$ gcc -S add.i -o add.s
$ file add.s
add.s: assembler source, ASCII text
```

**3. Assembling** turns that text into machine code — an **object file**: real binary instructions, but not yet a runnable program. Function names it doesn't define itself (like anything from the standard library) are left as blanks to fill in later:

```
$ gcc -c add.s -o add.o
$ file add.o
add.o: ELF 64-bit LSB relocatable, x86-64, ...

$ nm add.o
0000000000000000 T add
0000000000000018 T main
```

`nm` lists the symbols an object file defines. `T` means "defined, lives in the code section." Both `add` and `main` are already there — this particular file didn't need anything from outside itself.

**4. Linking** combines one or more object files, plus any libraries they need (like the C standard library, for something as ordinary as `printf`), into a single runnable executable — resolving every blank the assembler left behind:

```
$ gcc add.o -o add
$ file add
add: ELF 64-bit LSB pie executable, x86-64, dynamically linked, ...
```

## One flag, one stage

`gcc source.c -o program` runs all four stages back to back and deletes the intermediate files automatically — that's why it always looked like a single step. Each stage also has its own flag to stop the pipeline early and keep what it produced: `-E` stops after preprocessing, `-S` stops after compiling to assembly, `-c` stops after assembling to an object file. You'll reach for `-S` constantly starting next lesson — it's how you actually see the assembly your C turns into.
