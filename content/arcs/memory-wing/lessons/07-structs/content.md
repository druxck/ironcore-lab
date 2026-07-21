# Structs: Custom Rooms

Everything you've stored so far has been one value at a time - an `int`, a `char`, an array of one type. A **struct** lets you bundle several related values, possibly of different types, into a single new type you define yourself.

```c
struct sensor {
    int id;
    double reading;
};
```

This declares a new type, `struct sensor`, with two fields. Nothing is allocated yet - this is a blueprint, the same way `int` is a blueprint for a box that holds a whole number.

## Making one, and reading it back

```c
struct sensor s;
s.id = 7;
s.reading = 98.6;
printf("Sensor %d: %.1f\n", s.id, s.reading);
```

`s.id` uses the **dot operator** to reach into a struct *value* and access a field. Nothing new here conceptually - it's the same "reach inside and grab a piece" idea as everything you've done, just for a compound type instead of a single number.

## When you have a pointer to a struct instead

Structs get passed around by pointer constantly - copying a whole struct every time is wasteful once it has more than a couple of fields, and later lessons build structures that are only *reachable* through pointers at all. When what you're holding is `struct sensor *p` instead of `struct sensor s`, the dot operator doesn't apply directly - you'd have to write `(*p).id`, dereference first, then dot. C gives you a shorthand for exactly that pattern:

```c
struct sensor *p = &s;
p->id = 8;            // shorthand for (*p).id = 8;
printf("%d\n", p->reading > 0);
```

`->` **is** `(*p).field` - nothing more. Once that clicks, you'll never confuse dot and arrow again: dot when you're holding the struct itself, arrow when you're holding a pointer to one.

## A naming convenience

You'll very often see:

```c
typedef struct {
    int id;
    double reading;
} Sensor;
```

`typedef` here means you can write `Sensor` instead of `struct sensor` everywhere afterward - purely a naming convenience, changing nothing about how the type behaves.
