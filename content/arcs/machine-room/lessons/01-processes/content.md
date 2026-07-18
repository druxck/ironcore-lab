# Processes: Who Am I Running As

*Logbook: "The old timesharing racks in here used to run a dozen jobs at once on hardware that would embarrass a modern light switch. The trick was never really 'simultaneous' — it was one process table, carefully juggled."*

Every program you've written so far ran as a single **process**: one entry in the operating system's process table, one address space, one thread of execution moving through your `main()`. This room is about what happens when a C program stops being alone.

## fork(): one process becomes two

`fork()` is unlike any function you've called before — you call it once, and it returns *twice*.

```c
#include <unistd.h>

pid_t pid = fork();
```

Before this line, there was one process. After it, there are two: the original **parent** and a new **child**, which starts out as a near-exact copy of the parent — same variables, same open files, same point in the program, right after the `fork()` call. The only difference between them from that point on is the value `fork()` returned:

- In the **child**, `fork()` returns `0`.
- In the **parent**, `fork()` returns the child's **process ID** (a positive number) — the parent's own way of tracking which child it just created.
- If something goes wrong (the system is out of resources to create a new process), `fork()` returns `-1` and no child is created at all — worth checking for in real code, even though this lab's exercises won't force the failure path.

That's the whole trick behind every `if (pid == 0) { ... } else { ... }` you'll write in this room: both branches genuinely run, just in two different processes.

## Making order predictable with wait()

Once there are two processes, they run independently — the operating system schedules them however it likes, so *by default* you can't assume which one reaches a `printf()` first. `wait()` is how a parent process deliberately blocks until a specific child (or any child) finishes:

```c
#include <sys/wait.h>

wait(NULL);   // block here until a child exits
```

If a parent calls `wait()` before it prints anything, you've guaranteed the child ran to completion first — not by hoping the scheduler cooperates, but because the parent's own code can't move past that line until it does.

## Who am I, really

Every process has a **process ID** (PID) — `getpid()` returns your own, `getppid()` returns your parent's. The OS process table is the thing keeping track of every PID currently alive, along with what it's running and who created it. `fork()` is how that table grows.
