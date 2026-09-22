---
title: The original listing
banner: SOURCE
kicker: CHAPTER 02 / LISTINGS
subtitle: Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.
author: Lorem Ipsum
date: 2026-09-18
toc: true
---

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet.

## Printed on fanfold paper

Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla. Every fenced code block becomes a line-numbered listing:

```basic
10 REM LOREM IPSUM DOLOR SIT AMET
20 REM CONSECTETUR ADIPISCING ELIT
30 DIM A$(40)
40 LET A$ = "SED DO EIUSMOD TEMPOR"
50 FOR I = 1 TO 10
60   PRINT I; TAB(6); A$
70   IF I = 5 THEN GOSUB 200
80 NEXT I
90 PRINT "UT LABORE ET DOLORE"
100 END
200 REM ---- MAGNA ALIQUA ----
210 PRINT "  QUIS NOSTRUD EXERCITATION"
220 RETURN
```

Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Curabitur sodales ligula in libero.

## Assembly, more or less

Sed dignissim lacinia nunc. Curabitur tortor. Pellentesque nibh. Aenean quam. In scelerisque sem at dolor. Maecenas mattis.

```asm
; LOREM.ASM -- IPSUM DOLOR SIT AMET
        ORG     0100H
START:  LXI     H,MSG       ; CONSECTETUR ADIPISCING
        MVI     B,0DH       ; SED DO EIUSMOD
LOOP:   MOV     A,M         ; TEMPOR INCIDIDUNT
        CPI     '$'         ; UT LABORE
        JZ      DONE        ; ET DOLORE MAGNA
        CALL    PUTC        ; ALIQUA UT ENIM
        INX     H
        DCR     B
        JNZ     LOOP
DONE:   HLT                 ; AD MINIM VENIAM
MSG:    DB      'LOREM IPSUM$'
```

### Sed convallis

Sed convallis tristique sem. Proin ut ligula vel nunc egestas porttitor. Morbi lectus risus, iaculis vel, suscipit quis, luctus non, massa.

1. Fusce ac turpis quis ligula lacinia aliquet.
2. Mauris ipsum. Nulla metus metus, ullamcorper vel.
3. Tincidunt sed, euismod in, nibh.

## Notes on the margins

| Line | Lorem       | Ipsum                         |
| ---- | ----------- | ----------------------------- |
| 10   | Dolor       | Sit amet, consectetur         |
| 50   | Adipiscing  | Elit sed do eiusmod tempor    |
| 200  | Incididunt  | Ut labore et dolore magna     |

Quisque volutpat condimentum velit. Class aptent taciti sociosqu ad litora torquent per conubia nostra. [Back home](home.md).
