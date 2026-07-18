# Capstone: A Thread-Safe Work Queue

*Logbook, final entry for this annex: "Every bundle in this room comes down to one shape in the end: something feeding work in on one side, something taking it out on the other, and a set of connectors making sure neither side ever touches the wire while the other one's using it."*

A **bounded queue** is a fixed-capacity buffer that one or more producer threads push into and one or more consumer threads pop from. It needs to handle two waiting conditions correctly:

- A producer that tries to push into a **full** queue has to wait until a consumer makes room.
- A consumer that tries to pop from an **empty** queue has to wait until a producer adds something.

You have every piece this needs already: a mutex to protect the queue's internal state, and condition variables to make each side sleep — instead of spin — until the other side changes something.

## The shape of it

```c
typedef struct {
    int items[CAPACITY];
    int count, head, tail;
    pthread_mutex_t lock;
    pthread_cond_t not_full;
    pthread_cond_t not_empty;
} queue_t;
```

`push` waits on `not_full` while the queue is at capacity; `pop` waits on `not_empty` while it's at zero. Each one, after making its change, signals the *other* condition — a successful push means the queue is no longer empty, so it signals `not_empty`; a successful pop means it's no longer full, so it signals `not_full`.

```c
void push(queue_t *q, int value) {
    pthread_mutex_lock(&q->lock);
    while (q->count == CAPACITY) {
        pthread_cond_wait(&q->not_full, &q->lock);
    }
    q->items[q->tail] = value;
    q->tail = (q->tail + 1) % CAPACITY;
    q->count++;
    pthread_cond_signal(&q->not_empty);
    pthread_mutex_unlock(&q->lock);
}
```

`pop` is the mirror image: wait on `not_empty` while `count == 0`, remove from `head`, decrement `count`, signal `not_full`.

## The exercise

Implement `push` and `pop` on a fixed-capacity (4 slots) circular queue. A single producer thread pushes the integers 1 through 10 into it; a single consumer thread pops all ten and sums them. Print the final sum from `main`, after joining both threads — exactly `"Total: 55\n"`.

Every idea from this entire annex shows up here at once: threads that run concurrently, a mutex guarding shared state on every path in and out, and condition variables making each side wait correctly instead of guessing. Get the waiting conditions right — `while`, never `if` — and the queue behaves exactly the same no matter how the OS happens to schedule the two threads.
