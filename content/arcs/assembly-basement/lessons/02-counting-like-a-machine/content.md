# Counting Like a Machine

Binary is what the hardware speaks, but it's miserable for a human to read. `01001000 01100101 01101100 01101100 01101111` is "Hello" — good luck spotting a typo in that. So programmers almost never write raw binary. They write **hexadecimal** instead, and let it stand in for binary at a glance.

## Why hex fits binary perfectly

Hexadecimal (base 16) uses digits `0–9` then `A–F` for ten through fifteen. The reason it pairs so well with binary is arithmetic, not tradition: 16 is 2⁴, so **exactly 4 bits map to exactly 1 hex digit**, no remainder:

```
binary   hex
0000      0
0001      1
0010      2
...
1001      9
1010      A
1011      B
1100      C
1101      D
1110      E
1111      F
```

A full byte (8 bits) is just two of these 4-bit groups, so it's always exactly **two hex digits**. `1011 0110` splits into `1011` (= B) and `0110` (= 6), so the byte is `B6`. That's why you'll see memory addresses and byte values everywhere written like `0x4F` or `0xFF` — the `0x` prefix just means "what follows is hex," and every pair of hex digits is one byte, cleanly.

## Try reading one

`0xFF` — `F` is 1111, twice: `1111 1111`. That's every bit set to 1 in a byte, the largest value a byte can hold: 255.

`0x00` — obviously all zero bits.

Once this clicks, hex stops being "a weird base" and becomes what it actually is: **binary, compressed for human eyes.** You'll see it constantly — in memory addresses, in color codes, in error dumps — and every time, it's still just bits underneath.
