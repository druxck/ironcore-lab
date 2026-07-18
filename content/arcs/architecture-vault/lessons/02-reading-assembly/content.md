# Reading Assembly Without Fear

*Logbook: "New researchers always flinched at the disassembly printouts. Once you see it's just a small, repetitive vocabulary, the flinching stops."*

`objdump -d` disassembles a compiled binary back into assembly, labeled by function. You don't need to read fluently — you need to recognize maybe a dozen recurring patterns. Here's the exact, real output for the `add`/`main` program from last lesson, compiled with `gcc -O0 -g -o add add.c` and disassembled with `objdump -d add` — nothing here is invented or simplified for the lesson; this is what the tool actually printed.

## `add`

```
0000000000001129 <add>:
    1129: f3 0f 1e fa          endbr64
    112d: 55                   push   %rbp
    112e: 48 89 e5             mov    %rsp,%rbp
    1131: 89 7d fc             mov    %edi,-0x4(%rbp)
    1134: 89 75 f8             mov    %esi,-0x8(%rbp)
    1137: 8b 55 fc             mov    -0x4(%rbp),%edx
    113a: 8b 45 f8             mov    -0x8(%rbp),%eax
    113d: 01 d0                add    %edx,%eax
    113f: 5d                   pop    %rbp
    1140: c3                   ret
```

A few things to know before any of this means anything:

- This is **AT&T syntax** (objdump's default on Linux): `mov src,dst` — the destination is on the *right*, opposite of how Intel syntax and most textbooks write it. `%reg` is a register, `$N` is a literal immediate value, `endbr64` is a CPU security instruction you can ignore (it's there for indirect-branch protection, unrelated to what your C code does).
- `push %rbp` then `mov %rsp,%rbp` is the **function prologue** — practically every function compiled at `-O0` starts with exactly this pair. It saves the caller's frame pointer and establishes this function's own.
- The next two `mov` instructions copy the incoming arguments (`%edi`, `%esi` — more on those in a second) out of registers and into stack slots. At `-O0` the compiler doesn't trust anything to stay in a register longer than the next line needs it, so `a` and `b` get spilled to the stack immediately, then read back a few instructions later. This is exactly why `-O0` code looks so much more repetitive than what you'd get from `-O2` — nothing is being kept around cleverly yet.
- `add %edx,%eax` is the whole point of the function — everything else is bookkeeping. Immediately after, `pop %rbp; ret` is the **epilogue**, undoing the prologue and returning.

## `main`

```
0000000000001141 <main>:
    1141: f3 0f 1e fa          endbr64
    1145: 55                   push   %rbp
    1146: 48 89 e5             mov    %rsp,%rbp
    1149: be 04 00 00 00       mov    $0x4,%esi
    114e: bf 03 00 00 00       mov    $0x3,%edi
    1153: e8 d1 ff ff ff       call   1129 <add>
    1158: 5d                   pop    %rbp
    1159: c3                   ret
```

`main` loads the literal `4` into `%esi` and `3` into `%edi`, then `call`s `add`. Line up those register names against `add`'s own prologue above — `%edi` got spilled into `a`'s slot, `%esi` into `b`'s. That's not a coincidence, it's the **System V AMD64 calling convention** (the ABI every mainstream Linux C compiler follows): the first integer argument travels in `%edi`, the second in `%esi`, and so on. It's not written down anywhere in your C source — it's a real, load-bearing agreement between the compiler that generated `add` and the compiler that generated whatever calls it, which is exactly why it has to be followed exactly or nothing would ever be able to call anything else's compiled code correctly.

And the return value: `add`'s last real instruction before its epilogue leaves the sum sitting in `%eax`, and `main` never has to move it anywhere — `%eax` **is** the integer return-value register. That's the other half of the same convention.
