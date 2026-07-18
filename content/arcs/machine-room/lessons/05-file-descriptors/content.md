# File Descriptors Are Just Integers

*Logbook: "Every file, socket, pipe, and terminal this lab ever touches gets reduced to the same thing on the way in: a small integer. That uniformity is the whole design."*

Every `printf()` and `scanf()` you've written so far has secretly been going through **file descriptors** — small non-negative integers the kernel hands back when something is opened, and the *only* thing user code needs to read, write, or close it. Every process starts with three already open:

| fd | Name | Usual meaning |
|---|---|---|
| `0` | stdin | where input comes from |
| `1` | stdout | where normal output goes |
| `2` | stderr | where error output goes |

`printf()` is really just a convenience wrapper that ends up calling `write(1, ...)`. `scanf()` ends up calling `read(0, ...)`. You can call `read()`/`write()` yourself, directly:

```c
#include <unistd.h>

char buf[5];
read(0, buf, 5);    // read up to 5 bytes from fd 0 (stdin) into buf
write(1, buf, 5);   // write 5 bytes from buf to fd 1 (stdout)
```

Unlike `printf()`, `write()` doesn't null-terminate anything or know what a "string" is — it just moves the exact number of bytes you tell it to, from a buffer, to a file descriptor. That's the entire contract, and it's the same contract whether fd 1 happens to be your terminal, a file, or (as you'll see next lesson) the other end of a pipe.

## Getting the fd number wrong is a real, common bug

Because `read()`/`write()` take a plain integer, a typo is easy and the compiler can't catch it — `write(2, ...)` compiles exactly as cleanly as `write(1, ...)`, even though one sends its bytes to stderr and the other to stdout. A test harness (like this lab's, or `make check`, or CI) that only looks at stdout will see *nothing* if your output silently went to fd 2 instead of fd 1 — no crash, no warning, just missing output where you expected some.
