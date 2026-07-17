# What Is a Bit

> Logbook, Meridian Computing Laboratory — first entry after the dust sheets come off: *"Before anything else runs down here, you need to understand what these machines actually store. Not numbers. Not letters. Bits."*

Every value inside a running computer — a number, a letter, a pixel's color, this very sentence once it's loaded into memory — is stored as a sequence of **bits**. A bit is the smallest unit of information a computer has: it's either 0 or 1. Off or on. No charge or some charge on a transistor.

That's the entire vocabulary the hardware speaks. Everything else — integers, characters, structs, whole programs — is a convention for how to *interpret* a run of bits.

## Why binary, not decimal?

Computers are built from transistors, and a transistor is cheap and reliable at doing one thing: being clearly "on" or clearly "off." Building hardware that reliably told apart ten different voltage levels (for decimal digits 0–9) would be slower and far more error-prone than hardware that only has to distinguish two states. Binary won because it's what the physics makes easy and reliable.

## Bits become bytes

Bits are grouped into **bytes** — 8 bits at a time. 8 bits can represent 256 distinct values (2⁸ = 256), which is enough for a single character in many encodings, and it's the smallest unit most hardware actually addresses individually. When you later hear "a 32-bit integer," that means 4 bytes — 32 bits — wired together to represent one number.

## Reading binary

Decimal digits represent powers of ten — the `3` in `300` means 3 × 10². Binary digits represent powers of two the same way:

```
1   0   1   1     (binary digits)
8   4   2   1     (place values: 2³ 2² 2¹ 2⁰)
```

Add up the place values where there's a `1`: `8 + 0 + 2 + 1 = 11`. So `1011` in binary is `11` in decimal.

You won't spend your career hand-converting binary to decimal. But you *will* spend it reasoning about powers of two — buffer sizes, bit flags, why array indices start at 0 — and that reasoning starts here.
