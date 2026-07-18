# exec and the Process That Becomes Another

*Logbook: "fork() gives you a second process. exec() is the other half of the trick this whole room runs on: it doesn't make anything new — it turns the process you're already in into something else entirely."*

`fork()` duplicates a process. `execvp()` — one member of a whole family of `exec*()` functions — does something stranger: it **replaces** the calling process's own code, data, and stack with a different program entirely, in place, using the same process ID.

```c
#include <unistd.h>

char *argv[] = { "echo", "hello-from-exec", NULL };
execvp("echo", argv);
```

If `execvp()` succeeds, it **never returns** — there's no "process image" left to return into. Whatever program you named is now running, from its own `main()`, as if it had been launched directly. `execvp()` only returns at all if it *fails* (the named program couldn't be found or run), in which case it comes back with `-1` and your original code keeps going.

## The argv array needs a NULL at the end

`execvp()`'s second argument is the new program's own `argv` — and like every `argv` array in C, it must end with a `NULL` pointer so the called program knows where its argument list stops. Leave it off and you're handing the new program an argument list with no defined end, which is undefined behavior — it might happen to work by accident on one build and not another. Always terminate it explicitly.

## Buffered output doesn't survive a successful exec()

Here's a genuine gotcha, not a hypothetical one: `printf()` doesn't necessarily write to the terminal (or wherever stdout is going) the instant you call it. When stdout isn't connected to an interactive terminal — which is exactly the situation for every program graded in this lab — the C library **fully buffers** it, holding output in memory until the buffer fills, the program exits normally, or you call `fflush()` yourself.

`execvp()` replacing the process image skips all of that. There's no "program exiting normally" moment for the old program — it's just gone, buffer and all. Any `printf()` output you were counting on that hadn't been flushed yet is lost, silently, with no error. Call `fflush(stdout)` before an `exec*()` call if you need to guarantee something you already printed actually made it out first.
