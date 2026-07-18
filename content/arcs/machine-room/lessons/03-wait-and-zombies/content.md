# wait() and Zombie Processes

*Logbook: "A child process doesn't just vanish when it exits. Something has to collect it — an exit code doesn't deliver itself."*

When a child process finishes, the kernel doesn't discard it immediately. It keeps a small record around — mostly just the exit status — until the parent calls `wait()` (or `waitpid()`) to collect it. A child that has exited but hasn't been collected yet is called a **zombie**: dead, but still taking up a slot in the process table until its parent picks up the exit status. If a parent never calls `wait()`, its finished children stay zombies for as long as the parent keeps running.

## Reading the exit status correctly

`wait()` doesn't hand you a plain exit code — it hands you a packed `int` that encodes *how* the child ended (exited normally, was killed by a signal, etc.) along with the actual exit code, all packed into the same value. You almost never want to print that raw integer. You want `WEXITSTATUS()`:

```c
#include <sys/wait.h>

int status;
wait(&status);
int code = WEXITSTATUS(status);   // the real exit code
```

On this lab's real toolchain, a child that calls `exit(3)` produces a raw `status` value of `768` — not `3`. `WEXITSTATUS()` is a macro that shifts and masks the packed value back into the exit code you actually care about. The exact packing is a Linux/glibc convention, not something you should hardcode by hand (`status >> 8` happens to work here, but `WEXITSTATUS()` is the portable, documented way to get it, and it's what real code uses).

There's a matching `WIFEXITED(status)` you'll see in production code too — it checks whether the child actually exited normally at all (as opposed to being killed by a signal), before you trust `WEXITSTATUS()`'s answer. This lab's exercises always deal with a normally-exiting child, so we keep the focus on `WEXITSTATUS()` itself.
