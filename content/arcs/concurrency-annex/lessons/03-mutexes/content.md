# Mutexes: Taking Turns

*Logbook: "Every jack in this bundle only carries one signal at a time. That's not a limitation of the wiring — that's the whole point of a mutex."*

A **mutex** — short for "mutual exclusion" — is a lock. Exactly one thread can hold it at a time; every other thread that tries to lock it simply waits until it's free. You already used one in the last lesson to fix a racing counter. This lesson is about using one correctly on purpose, not just patching a bug after the fact.

## The rule

Any piece of state that more than one thread can touch needs a mutex, and **every single access to that state — reads included, not just writes — has to happen while holding the lock**. A mutex that only guards the writes and lets reads happen freely doesn't actually protect anything: a thread can still read a value in the middle of another thread's half-finished update.

```c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
int total = 0;

pthread_mutex_lock(&lock);
total += amount;
pthread_mutex_unlock(&lock);
```

## The trap: every path needs its unlock

A locked mutex that never gets unlocked is not a safer program — it's a frozen one. The next thread that tries to lock the same mutex will simply wait forever. This happens more often than you'd think, usually because of an early return:

```c
pthread_mutex_lock(&lock);
if (amount < 0) {
    return NULL;   // bug: lock is still held!
}
total += amount;
pthread_mutex_unlock(&lock);
```

That early `return` skips right past the unlock. The fix isn't clever — it's just discipline: **every path out of a locked section, including early returns and error cases, has to unlock first.**

```c
pthread_mutex_lock(&lock);
if (amount < 0) {
    pthread_mutex_unlock(&lock);
    return NULL;
}
total += amount;
pthread_mutex_unlock(&lock);
```

It's not elegant. It's also exactly what correct code looks like — every `lock` needs a matching `unlock` on every single path through the function, the same discipline as making sure every `malloc` has a matching `free`.
