# Building Real Structures

A **linked list** is the first real data structure you'll build in this lab, and it exists to answer a specific limitation: arrays have a fixed size, decided at creation. A linked list grows one node at a time, for as long as you need it to.

## The self-referential struct

```c
struct node {
    int value;
    struct node *next;
};
```

Read `struct node *next` carefully: it's a **pointer** to a `struct node`, not another `struct node` embedded inside this one. That distinction isn't stylistic - it's the only reason this compiles at all. If a `struct node` tried to directly contain a whole other `struct node` (no pointer), the compiler would need to know its size to compute the size of the outer one, which needs the size of *its* inner one, forever, with no base case. A pointer sidesteps this completely: no matter what it points to, a pointer is always the same fixed size - the size of an address - so a struct holding a pointer to its own type is no different, size-wise, from a struct holding a pointer to an `int`.

## One node at a time

Each node is `malloc`'d individually, and chained to the next by setting `->next`:

```c
struct node *a = malloc(sizeof(struct node));
a->value = 10;
a->next = NULL;   // no node after this one yet
```

A list is just a pointer to its first node - commonly called `head` - and every other node is reached by following `->next` links from there. The last node's `->next` is `NULL`, which is how you know you've reached the end.

## Traversing

```c
struct node *cur = head;
while (cur != NULL) {
    printf("%d\n", cur->value);
    cur = cur->next;
}
```

This pattern - walk a pointer forward until it's `NULL` - is the single most common loop shape you'll write over any pointer-based structure from here forward.

## Freeing an entire list

Freeing takes more care than freeing a single block, because once you `free(cur)`, you can no longer safely read `cur->next` - that would be the use-after-free bug from two lessons ago. Save the next pointer *before* freeing:

```c
struct node *cur = head;
while (cur != NULL) {
    struct node *next = cur->next;   // save it first
    free(cur);
    cur = next;                       // then move using the saved copy
}
```

Every node you `malloc` in a list needs exactly one matching `free`, same rule as always - it just now has to happen in a loop instead of a single line.
