# What -O2 Actually Does

*Logbook: "The old timing logs down here show the same programs, recompiled years apart, getting faster with no code changes at all. That was always the optimizer, not the hardware."*

Every exercise in this lab compiles at `-O0` — no optimization — on purpose: it keeps line numbers, variable values, and sanitizer reports lined up exactly with your source, which matters far more for learning than speed does. But it's worth seeing, for real, what asking for optimization actually changes, because "the compiler makes it faster" undersells what's really happening. The compiler doesn't guess. It only ever applies a transformation it can *prove* leaves the program's observable behavior unchanged.

## The same program, two ways

Here's `add`/`main` from two lessons ago, compiled two different ways. First, no optimization (`-O0`, what you've seen all lesson):

```
mov    $0x4,%esi
mov    $0x3,%edi
call   add
```

Now with `-O2`:

```
0000000000001040 <main>:
    1040: f3 0f 1e fa    endbr64
    1044: b8 07 00 00 00 mov    $0x7,%eax
    1049: c3             ret
```

That's the *entire* function. No call to `add`. No loading of `3` or `4` into anything. `gcc` looked at `add(3, 4)`, saw that both arguments are literal constants and that `add` just returns their sum, and proved the whole expression is always exactly `7` — so it replaced the call with the number `7`, directly in the register `main` was going to return it from. This specific transformation has a name: **constant folding**. It isn't a special case or a trick reserved for tiny toy examples — it's one of dozens of provably-safe transformations the optimizer applies everywhere it can, and it compounds: eliminating one function call can expose another opportunity right behind it.

## What's left behind

Check whether `add` itself is still in the binary after this — `nm` still lists it:

```
0000000000001140 T add
```

Even though nothing in `main` calls it anymore, the compiled function is still sitting there, fully intact. Why? `add` has **external linkage** by default — any other `.c` file that gets linked into this program later could, in principle, declare `int add(int, int);` and call it. The compiler has no way to prove that won't happen, so deleting it outright would be unsafe. Mark it `static` instead —

```c
static int add(int a, int b) {
    return a + b;
}
```

— and you're telling the compiler something concrete: nothing outside this file can ever call this function. Recompile at `-O2` with that one keyword added, and `add` disappears from the binary completely; `nm` finds nothing. Same optimizer, same proof-based reasoning, just handed one more fact it's now allowed to use.
