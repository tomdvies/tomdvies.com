---
title: 'Implementing curve agnostic Elliptic Curve Signatures from scratch in Rust'
date: 2024-09-01
draft: false
summary: |
    If Bob wants to talk to Alice over an insecure channel, can he guarantee the messages come from her?
    The answer is yes, one method for achieving this is the Elliptic Curve Digital Signature Algorithm (ECDSA).
    In the modern day, ECDSA is used in a variety of applications to ensure the integrity of messages passed over insecure channels, including Bitcoin, and Ethereum.
    This blog post details how it works, and provides a toy example implemented entirely from scratch in rust.
---
If Bob wants to talk to Alice over an insecure channel, can he guarantee the messages come from her?
The answer is yes, one method for achieving this is the Elliptic Curve Digital Signature Algorithm (ECDSA).
In the modern day, ECDSA is used in a variety of applications to ensure the integrity of messages passed over insecure channels, including Bitcoin, and Ethereum.
This is a post on building a rust implementation of ECDSA over finite fields of order p, where the underlying curve is an arbitrary specified elliptic curve. 
Very little high level maths is assumed, and the content should be fairly accessible to people with little prior maths knowledge.
It is **not** a rigorous treatment of elliptic curves in general, and the code provided is **not** guaranteed to be cryptographically secure.

We will cover 3 sections, [finite fields](#finite-fields), [elliptic curves](#elliptic-curves), and finally [ECDSA](#elliptic-curve-digital-signature-algorithm).
Each section inherits from the previous,
the objects' implementations are provided and explained in situ with their maths. 

### Finite Fields
Before we can go on, understanding the rest of this blog hinges on "fields", these are a set of objects where you can do basic operations like adding, subtracting, multiplying, and dividing, and these operations behave in the way you expect. 
#### Fields in general
A Field is a set of "elements" that are endowed with two associated "relations" \((+, \bullet)\) these operations act as one would expect (addition and multiplication on the real numbers).
- If \(a\) and \(b\) are in your set then both \(a\bullet b\) and \(a + b\) are in your set
- There exists an element \(0\) such that for all \(a\) in your set \(a+0=a\)
- There exists an element \(1\) such that for all \(a\) in your set \(a\bullet 1=a\)
- If \(a\) is in your set, then \(-a\) is also in your set such that \(a+(-a) = 0\) and \(b+(-a)\) is denoted by \(b - a\)
- If \(a\) is in your set and is not \(0\), then \(a^{-1}\) is also in your set such that \(a\bullet a^{-1} = 1\)


These operations also follow a couple of "nice" rules
- Associativity, for all \(a, b, c\) we have \(a + (b + c) = (a + b) + c\) and \(a \bullet (b \bullet c) = (a \bullet b) \bullet c\)
- Commutativity, for all \(a, b\) we have \(a \bullet b = b \bullet a\) and \(a + b = b + a\)
- Distributivity, for all \(a,b,c\) we have \(a \bullet (c+b) = a\bullet b + a\bullet c\)
 
#### Fields mod p
The specific type of field that we will consider here will be \(\F_p\), where \(p\) is a prime number, the set of numbers we
consider is \(\{0,1,2, \ldots\,,  p-1\}\), and \((+, \bullet)\) work like normal addition but "wrap around" at \(p\).
This keeps all our numbers inside our set.
A clock gives is a good way to imagine this. On a 12-hour clock:

- After 12 o’clock, it “wraps around” and starts again at 1. So, if it’s 11 o’clock and we add 2 hours, we don’t get 13—we get 1 o’clock again.

This is similar to how mod  p  works, but instead of wrapping around after 12, we wrap around after  p , which is any prime number (e.g., 5, 7, 11). We will go over inverses in \(\F_p\) later, when we implement an `inverse_modp` function.
