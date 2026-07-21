# Threads: Running Two Places at Once

*Logbook: "The braided bundles in this annex aren't decoration - every wire pair in here was once carrying a separate experiment, running at the same time as its neighbor, on the same machine. That's the whole idea of this room."*

Every program you've written so far has had exactly one thread of execution: one instruction pointer, moving through your code one step at a time. A **thread** is that same idea - one instruction pointer working through code - except a single process can now have more than one of them running at once, all sharing the same memory.

## Creating a thread

The POSIX threads API (`pthread`) gives you `pthread_create`:

```c
#include <pthread.h>

void *worker(void *arg) {
    // this function runs on the new thread
    return NULL;
}

pthread_t t;
pthread_create(&t, NULL, worker, NULL);
```

`pthread_create` takes a pointer to a `pthread_t` to fill in, an (usually unused) attributes pointer, the function the new thread should start running, and a `void *` argument to pass it. The function you hand it has to match one exact shape: `void *(*)(void *)` - it takes a `void *` and returns a `void *`. Hand it a function with any other signature and the compiler will warn you loudly (rightly so - the mismatch means whatever the OS ends up calling isn't really the function you wrote).

## Waiting for it to finish

`pthread_join` blocks the calling thread until the target thread has finished running:

```c
pthread_join(t, NULL);
```

Without a join, your `main` function has no idea whether the thread it spawned is still running, already done, or hasn't started yet - and if `main` returns first, the whole process can exit and take every other thread down with it, finished or not.

## Concurrent, not necessarily simultaneous

"Running at the same time" is doing a lot of work in that sentence. On a machine with multiple CPU cores, two threads genuinely can execute instructions at the literal same instant. On a single core, the OS is switching between them faster than you can observe, giving the illusion of simultaneity. Either way, from your program's perspective the rule is the same: **you cannot assume any particular order** in which two threads' instructions interleave, unless you explicitly enforce one. That single fact is the reason the rest of this room exists.
