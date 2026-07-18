# Atomics and the Cost of Ordering

*Logbook: "Not every crossed wire in this annex needs a full lock. Some of them just need a connector rated to handle two signals arriving at once without either one getting clipped."*

A mutex is the general-purpose tool: it can protect any amount of shared state, of any shape, across any number of operations. That generality has a cost — locking and unlocking isn't free, and if all you actually need is "increment this one integer safely," a full mutex is more machinery than the job requires.

## `stdatomic.h`

C11 added a standard set of atomic types and operations, declared in `<stdatomic.h>`:

```c
#include <stdatomic.h>

atomic_int counter = 0;

atomic_fetch_add(&counter, 1);
int current = atomic_load(&counter);
```

`atomic_fetch_add` performs the read-add-write sequence from two lessons ago as a single indivisible hardware operation — there's no window where another thread's `atomic_fetch_add` on the same variable could interleave with it. No `pthread_mutex_t` required, no lock/unlock pair to get right.

## Where atomics stop being enough

"Atomic" is a narrower guarantee than it sounds. It means *this one operation* — this specific add, this specific load — can't be torn or interleaved. It says nothing about protecting a *group* of related operations together. If you need to update two different shared variables so they always change in sync with each other, or check one value and then act on it as a single logical step, individual atomic operations on each variable separately don't give you that — you're back to needing a mutex around the whole sequence. Reach for an atomic when the shared state really is a single value with a single simple operation on it (a counter, a flag). Reach for a mutex the moment more than one variable, or more than one step, has to change together as a unit.
