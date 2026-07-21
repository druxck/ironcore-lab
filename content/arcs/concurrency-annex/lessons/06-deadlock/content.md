# Deadlock: When Everyone's Waiting

*Logbook: "Two threads, two locks, both held, neither one able to move. Not a crash. Not an error message. Just silence, forever, until someone kills the process by hand."*

A single mutex can only ever wait on itself, and a thread can't deadlock against a lock nobody else wants. Deadlock shows up the moment you have **two or more** locks in play, and different threads are allowed to acquire them in different orders.

## The classic pattern: AB-BA

```c
// thread 1
pthread_mutex_lock(&lockA);
pthread_mutex_lock(&lockB);   // waits here if thread 2 already has B
...
pthread_mutex_unlock(&lockB);
pthread_mutex_unlock(&lockA);

// thread 2
pthread_mutex_lock(&lockB);
pthread_mutex_lock(&lockA);   // waits here if thread 1 already has A
...
pthread_mutex_unlock(&lockA);
pthread_mutex_unlock(&lockB);
```

Walk through the unlucky timing: thread 1 locks A. Thread 2 locks B. Now thread 1 tries to lock B - held by thread 2, so it waits. Thread 2 tries to lock A - held by thread 1, so it waits too. Both threads are now waiting for a lock the *other one* is holding, and neither will ever release what it has, because releasing happens *after* the line they're stuck on. Nothing will ever unstick this on its own. That's a deadlock.

The unsettling part is that this doesn't happen every run - it depends on both threads reaching their second lock at close to the same moment. A quick test run might complete instantly a dozen times in a row and never show you the bug at all, right up until it hits production and hangs.

## The fix: pick one order and never break it

The reliable fix isn't clever, it's procedural: **every thread that needs both locks must acquire them in the same order.** If everyone always locks A before B, the AB-BA situation above simply can't occur - whichever thread gets A first is guaranteed to get B next, because no other thread can be holding B without already holding A.

```c
// both threads, always:
pthread_mutex_lock(&lockA);
pthread_mutex_lock(&lockB);
...
pthread_mutex_unlock(&lockB);
pthread_mutex_unlock(&lockA);
```

That's the whole fix. No new API, no clever data structure - just a rule every piece of code touching both locks has to follow.
