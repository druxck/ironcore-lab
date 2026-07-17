# Ghosts in the Machine

*Logbook: "Half the old repair tickets down here describe the same three symptoms in different words. Once you've seen each one clearly, you'll never mistake it for a mystery again."*

You now have everything you need to write all three classic memory bugs. Here's what each one actually looks like, and — more importantly — the instruments this lab uses to catch them, because "stare at the code until you spot it" stops scaling the moment a program gets past a few dozen lines.

## The three ghosts

**A leak** — memory you `malloc`'d that nothing points to anymore, and you never `free`'d. Not dangerous in the sense of crashing you immediately, but a long-running program that leaks will eventually exhaust its memory.

**A dangling pointer / use-after-free** — you `free`'d a block, then kept using the pointer as if it were still valid. The memory might still visibly hold your old data for a while (which is exactly what makes this bug so nasty — it can *look* like it works), or it might already have been handed to something else entirely.

**A double free** — calling `free` twice on the same pointer. The heap's internal bookkeeping isn't designed to be told "give this back" a second time, and doing so corrupts it in ways that often don't crash where the mistake actually happened, but somewhere unrelated, later.

## The instruments

Every exercise in this lab already compiles with **AddressSanitizer** and **UndefinedBehaviorSanitizer** built in — they've been quietly watching all along. From here on you'll actually see what they say when something goes wrong: a dangling-pointer or double-free bug gets caught the instant it happens, with a report naming the exact line, in the **Raw Terminal** tab of your output panel.

**Valgrind** is a different kind of tool — instead of instrumentation baked in at compile time, it runs your *already-compiled* program inside its own simulated CPU, watching every single memory access. It's slower, but it catches leaks that sanitizers can miss, and its leak report tells you not just that memory was lost, but the exact call stack that allocated it. Exercises in this lesson that grade on `valgrind-clean` run your solution through it automatically when you submit — you don't invoke it yourself.

**gdb** is the one you drive interactively (in this lab, through a scripted session): attach it to a program, let it run, and when the program crashes, ask for a `backtrace` — the chain of function calls that were active at the moment of the crash. It doesn't just tell you *that* something went wrong, it tells you exactly where in your call stack it happened.

None of these tools change what's wrong with your code. They just make what's wrong impossible to miss.
