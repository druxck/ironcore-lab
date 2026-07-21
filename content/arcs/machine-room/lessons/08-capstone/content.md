# Capstone: A Tiny Shell

*Logbook, final entry for this room: "Every rack down here does the same three things in sequence: read a command, become that command, wait for it to finish. That's not a simplification of what a shell does - it's actually most of it."*

You've now built every piece a shell needs. This capstone asks you to wire them together into the smallest thing that can honestly be called one.

## The loop, boiled down to one iteration

A real shell repeats this forever; this exercise does it once, for one line of input:

1. **Read** a line of text (`fgets`).
2. **Parse** it into words - a NULL-terminated `argv` array, exactly what `execvp()` needs.
3. **fork()** - you need a child, because `execvp()` replaces whatever process calls it, and you don't want to replace your shell itself.
4. In the child, **execvp()** the command.
5. In the parent, **wait()** for the child to finish before doing anything else (in a real shell, before printing the next prompt).

## Splitting a line into words

`strtok()` is the standard tool for this: it splits a string on a set of delimiter characters, returning one token at a time.

```c
char *tok = strtok(line, " ");
while (tok != NULL) {
    // tok is one word
    tok = strtok(NULL, " ");
}
```

Two things worth watching for: `fgets()` keeps the trailing newline if there was room for it, so strip that before tokenizing - and don't forget the `NULL` terminator at the end of your finished `argv` array, for the same reason it mattered back in the exec lesson.

## What "done" means here

No custom prompt string, no extra output of your own - the grader is only checking that the command you're asked to run actually ran and produced its real output. Everything else (fork, exec, wait, parsing) is invisible plumbing, exactly like a real shell.
