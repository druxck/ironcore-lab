# Capstone: A Stack That Doesn't Leak

*Logbook, final entry for this wing: "Everything down here has been in pieces - a pointer here, a malloc there. Time to wire it all together into something that actually does a job."*

A **stack** is a last-in-first-out structure: the most recent thing you added (`push`) is the first thing you get back out (`pop`). You already built every piece this needs in the last three lessons - a self-referential struct, heap allocation, and a pointer-to-pointer that lets a function modify the caller's head reference. This capstone asks you to assemble them.

## The shape of it

```c
struct node {
    int value;
    struct node *next;
};
```

`push` adds a new node at the front of the list (exactly the `insert_head` you already wrote), and `pop` removes the front node, returning its value:

```c
int pop(struct node **top) {
    struct node *n = *top;
    int value = n->value;   // read the value out first
    *top = n->next;         // move the top pointer past this node
    free(n);                // only now is it safe to free it
    return value;
}
```

Notice the order: read everything you need from `n`, *then* update `*top`, *then* `free`. Reverse any of those steps and you're back to a use-after-free.

## What "done" means here

This exercise is graded on three things at once, all required to pass:

- **Correct output** - the values come back out in the right order.
- **`sanitizer-clean`** - no AddressSanitizer or UBSan findings anywhere in the run.
- **`valgrind-clean`** - every node you allocate gets freed. Not most of them. All of them.

That's not a harder version of the same exercise - it's the actual standard real C code gets held to. A stack that returns the right numbers but leaks every third node isn't a working stack, it's a slow leak with good PR. Build it clean the first time and the "No Ghosts in This Machine" achievement is yours.
