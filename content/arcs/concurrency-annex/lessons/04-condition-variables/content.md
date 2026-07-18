# Condition Variables: Waiting for Something to Happen

*Logbook: "A mutex tells threads 'not while I'm using it.' It has nothing to say about 'wake me up when there's something to do' — that's a different wire entirely."*

A mutex protects shared state. It doesn't help a thread that needs to *wait* for that state to change — nothing stops a thread from locking, checking, unlocking, locking again, checking again, over and over, burning CPU the whole time. That polling loop works, technically, but it's wasteful and it's not what this room is about.

## Sleeping until told otherwise

A `pthread_cond_t` — a condition variable — lets a thread go properly to sleep until another thread explicitly wakes it up:

```c
pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t cond = PTHREAD_COND_INITIALIZER;
int ready = 0;

// the waiting thread:
pthread_mutex_lock(&lock);
while (!ready) {
    pthread_cond_wait(&cond, &lock);
}
// ready is true now, and we're holding the lock again
pthread_mutex_unlock(&lock);

// the signaling thread:
pthread_mutex_lock(&lock);
ready = 1;
pthread_cond_signal(&cond);
pthread_mutex_unlock(&lock);
```

`pthread_cond_wait` does something worth noticing: it atomically unlocks the mutex and puts the thread to sleep, so no other thread can slip in and change `ready` in the gap between "check the flag" and "start waiting." When another thread calls `pthread_cond_signal`, the sleeping thread wakes back up and *re-acquires the mutex* before `pthread_cond_wait` returns — you never have to lock it again yourself.

## Why `while`, not `if`

Notice the wait sits inside a `while` loop, not a plain `if`. This isn't defensive paranoia — it's a real requirement of the API. POSIX explicitly allows `pthread_cond_wait` to return even without anyone calling signal (a "spurious wakeup"), and even when it isn't spurious, by the time your thread actually gets scheduled back onto a CPU, some *other* thread might have already grabbed the resource you were waiting for. An `if` checks the condition once and trusts it; a `while` checks it again every time you wake up, and goes right back to sleep if it turns out not to be true yet. Always wait in a loop.
