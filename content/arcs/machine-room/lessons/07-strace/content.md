# Watching Syscalls with strace

*Logbook: "Every tool in this room so far has been about writing C. strace doesn't care what language wrote your program at all — it watches the one conversation every program eventually has, no matter what: the one with the kernel."*

Everything this whole room has covered — `fork()`, `exec()`, `wait()`, signals, `read()`/`write()`, pipes — is a **syscall**: a request from your process to the kernel, asking it to do something user code isn't allowed to do on its own (create a process, touch a file, talk to hardware). `strace` attaches to a running program and prints every syscall it makes, in order, with its real arguments and real return value.

Take the smallest possible C program:

```c
#include <stdio.h>

int main(void) {
    printf("hi\n");
    return 0;
}
```

Run it under `strace -e trace=write` (filtering down to just the `write` syscall, since a full unfiltered trace of even this tiny program is dozens of lines of dynamic-linker setup before `main()` even starts) and here's the real output:

```
write(1, "hi\n", 3)                     = 3
+++ exited with 0 +++
```

Read left to right: the syscall is `write`, called with three arguments — file descriptor `1` (stdout, from last lesson), the exact bytes `"hi\n"`, and a length of `3`. The `= 3` at the end is the **return value**: `write()` reports back how many bytes it actually wrote, which here is all 3.

## printf() isn't magic — it's buffering plus write()

`printf("hi\n")` doesn't talk to the kernel directly. It formats your string in a buffer in your process's own memory, and only calls the real `write()` syscall when that buffer needs to be flushed out — which is exactly what the trace above shows happening once, for the whole line. This is the same buffering behavior from the exec lesson: `printf()` is a library-level convenience built on top of the syscall layer, not a syscall itself.
