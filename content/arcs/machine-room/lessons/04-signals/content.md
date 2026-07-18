# Signals: Interrupting the Machine

*Logbook: "Half the panic-inducing 'my program just vanished with no error message' tickets in this lab turn out to be the same thing: a signal nobody installed a handler for."*

A **signal** is a small, asynchronous notification the kernel delivers to a process — "something happened; deal with it." `SIGINT` is what a terminal sends a process when you press Ctrl+C. `SIGSEGV` is what the kernel sends when your program touches memory it shouldn't (you've been seeing this one since Memory Wing, even if it wasn't named). This lesson is about `SIGUSR1`/`SIGUSR2` — two signals reserved specifically for whatever a program wants to use them for — and installing a handler to catch one.

## Installing a handler

```c
#include <signal.h>

void handler(int sig) {
    printf("caught it\n");
}

signal(SIGUSR1, handler);
```

Once installed, delivering `SIGUSR1` to this process runs `handler()` instead of whatever the signal's *default* behavior would have been — interrupting whatever the program was doing, running your handler, then resuming.

## Signals have a default disposition, even without a handler

This is the part that surprises people the first time: `SIGUSR1` and `SIGUSR2` aren't harmless by default. If *no* handler is installed for them, the kernel's default action for both is to **terminate the process** — silently, with no error message printed by your program, because your program never got a chance to run any code at all. Register a handler for the wrong signal (or forget to register one at all) and the process that was supposed to print something instead just ends, with nothing in its output at all.

## Signaling yourself

Real signals usually come from somewhere else — the terminal, another process, the kernel itself. But a process can also signal *itself*, which is exactly how this lab's self-contained exercises work, since there's no other process around to send one in:

```c
#include <signal.h>

raise(SIGUSR1);   // deliver SIGUSR1 to this same process, right now
```

`raise()` is synchronous from the caller's point of view for the purposes of this lab's exercises — by the time it returns, the handler (if one is installed and matches) has already run.
