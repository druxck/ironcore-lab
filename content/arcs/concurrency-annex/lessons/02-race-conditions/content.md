# Race Conditions, Made Visible

*Logbook: "This is the ticket that used to drive the old researchers up the wall — a program that worked every time in testing, then quietly returned the wrong number in production. Nothing crashed. Nothing warned them. It just lied."*

`counter++` looks like one step. It is not. Underneath, it's three:

1. Read the current value of `counter` into a register.
2. Add one to it.
3. Write the new value back to `counter`.

If exactly one thread ever touches `counter`, that doesn't matter — the three steps always happen back to back. But if two threads both run `counter++` at close to the same moment, both can read the *same* starting value before either writes anything back. Say `counter` is 40. Thread A reads 40. Before A writes 41 back, thread B also reads 40. Both add one. Both write 41. Two increments happened, and the counter only went up by one. That's a **race condition**: the correctness of the result depends on the timing of two threads, and timing isn't something your program controls.

The cruel part is that this bug is often invisible in casual testing — most of the time, one thread's three steps finish before the other one starts, and you get the right answer anyway. It's only under real load, or on a machine with different timing, that the collision actually happens and the count comes back short.

## Proving a fix, honestly

Some toolchains have a dedicated tool for this — ThreadSanitizer, which instruments every shared-memory access and flags a race the instant it happens, even if the race never actually produces a wrong answer on that particular run. This lab's toolchain doesn't have that build wired in — it always compiles with AddressSanitizer and UndefinedBehaviorSanitizer (which catch memory-safety and undefined-behavior bugs, not data races) or, separately, runs under Valgrind for leak checking. Neither one will tell you "there's a race here."

So this lesson proves it the older, lower-tech way, and it's a completely reliable one: run the increment enough times, across enough threads, that an unprotected race would almost certainly produce a visibly wrong total — then grade your submission on whether the final number is **exactly** right. A correctly synchronized counter gets the exact right total every single time, with zero room for a "close enough." That's not a weaker guarantee than a race detector — for this specific bug, it's just as conclusive, and it's honest about what tooling this lab actually has running underneath it.

## The fix

A `pthread_mutex_t` turns the three-step `counter++` back into something that behaves like one atomic step, by making sure only one thread can be in the middle of it at a time:

```c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

pthread_mutex_lock(&lock);
counter++;
pthread_mutex_unlock(&lock);
```

Any other thread that calls `pthread_mutex_lock` while this one holds the lock simply waits — it can't proceed until the first thread unlocks. Slower than an unguarded `counter++`, certainly. But now the "read, add, write" sequence can never be interrupted by another thread doing the same thing, and the count comes out right every time.
