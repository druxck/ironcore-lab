# Measuring Instead of Guessing

*Logbook: "The junior researchers always had a theory about which version was faster. About half of them were right. The ones who actually timed it were right a lot more often than that."*

Last lesson's row-major-vs-column-major result — 0.62ms against 12.04ms — didn't come from reasoning about cache lines in the abstract. It came from actually timing both versions. Real profiling tools like `perf` exist for finding *where* time goes in a large program, but they need setup this lab doesn't provision. The simpler, always-available technique — good enough for exactly the kind of "is A or B faster" question you'll ask constantly — is timing a piece of code yourself with `clock_gettime`.

## The API, and the bug hiding in the obvious version

```c
struct timespec start, end;
clock_gettime(CLOCK_MONOTONIC, &start);
// ... the work you're timing ...
clock_gettime(CLOCK_MONOTONIC, &end);

double elapsed_ms = (end.tv_sec - start.tv_sec) * 1000.0
                  + (end.tv_nsec - start.tv_nsec) / 1e6;
```

`struct timespec` splits time into whole seconds (`tv_sec`) and nanoseconds within that second (`tv_nsec`, always `0`–`999999999`). The obvious-looking mistake is subtracting `tv_nsec` fields on their own and assuming the result is positive — it isn't, whenever the end timestamp's nanosecond field happens to be smaller than the start's (because the extra time carried over into `tv_sec` instead). Example: start is 10.5s in, end is 12.1s in — genuinely 1.6 seconds apart — but `end.tv_nsec - start.tv_nsec` alone is `100000000 - 500000000`, a *negative* number. The formula above handles it correctly because it computes both parts together: the whole-second difference in milliseconds, plus the (possibly negative) nanosecond difference converted to milliseconds, added together. Get this wrong and your "measurement" is just noise with a plausible-looking sign.

## Why `CLOCK_MONOTONIC`, specifically

There's more than one clock. `CLOCK_REALTIME` tracks the actual wall-clock date and time — which means it can jump, forward or backward, whenever the system clock gets corrected (NTP sync, a manual date change, a VM resuming from suspend). A benchmark timed against a clock that can jump backward can report a *negative* elapsed duration for real work that definitely took positive time. `CLOCK_MONOTONIC` is defined to never do that — it only ever counts forward, at a steady rate, from some arbitrary starting point (never treat its raw value as a real date; it's only meaningful as a difference between two readings). For measuring "how long did this take," it's always the right choice.

## How a naive benchmark lies to you anyway

Getting the clock right isn't the only trap:

- **The optimizer can delete the work you meant to measure.** If you compute a result and never use it, the compiler is fully entitled to conclude the whole computation has no observable effect and remove it entirely — you'd end up timing an empty loop. Real benchmarks make sure the computed result gets used (printed, returned, or otherwise forced to matter) so the compiler can't optimize it away.
- **One sample is noise, not a measurement.** A single run can be thrown off by another process waking up, a page fault, a cold cache from the very first touch of some memory. Repeat the timed section many times and look at the fastest or the median run, not whatever the first one happened to say.
- **The first run is often unfairly slow.** The very first access to a block of memory (or the first call to a function) can pay a one-time cost — a cold cache line, a page fault, a lazily-resolved dynamic symbol — that has nothing to do with the algorithm you're actually trying to measure. Professional benchmarks run a "warm-up" pass before the one that counts.
