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

## Finite Fields
Before we can go on, understanding the rest of this blog hinges on "fields", these are a set of objects where you can do basic operations like adding, subtracting, multiplying, and dividing, and these operations behave in the way you expect. 
### Fields in general
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
 
### Fields mod p
The specific type of field that we will consider here will be \(\F_p\), where \(p\) is a prime number, the set of numbers we
consider is \(\{0,1,2, \ldots\,,  p-1\}\), and \((+, \bullet)\) work like normal addition but "wrap around" at \(p\).
This keeps all our numbers inside our set.
A clock gives is a good way to imagine this. On a 12-hour clock:

- After 12 o’clock, it “wraps around” and starts again at 1. So, if it’s 11 o’clock and we add 2 hours, we don’t get 13—we get 1 o’clock again.

This is similar to how mod  p  works, but instead of wrapping around after 12, we wrap around after  p , which is any prime number (e.g., 5, 7, 11). 

### Implementation Details

The implementation of our finite field arithmetic can be found in `fpelem.rs`. Here we go over the key functions.

#### Modular Subtraction (`sub_mod`) 
For subtraction, we handle the case where a < b by adding the modulus, otherwise just doing regular subtraction:
```rust
if a >= b {
    return a - b;
} else {
    return m - b + a;
}
```
This was grabbed from [here](https://www.jjj.de/fxt/fxtbook.pdf)

#### Modular Addition (`add_mod`)
Addition in a finite field needs to wrap around at p. Rather than implementing this directly, we use a clever trick:
```rust
if b == 0 { 
    return a
}
let b = m - b;
sub_mod(a, b, m)
```
This converts addition into subtraction, allowing us to reuse the subtraction logic.

#### Modular Multiplication (`mul_mod`)
Multiplication is implemented using the binary expansion method. This works by breaking down multiplication into repeated addition based on the binary representation of numbers. 13 × 7 as an example:

1. First convert 13 to binary: \(13 = 1101_2\)
2. Now this means we can rewrite 13 as: \(13 = 2^3 + 2^2 + 2^0\)
3. Therefore: \(13 \times 7 = (2^3 + 2^2 + 2^0) \times 7 = (8 + 4 + 1) \times 7 = 8\times7 + 4\times7 + 1\times7\)

In our implementation, we:
1. Look at each bit of the multiplier (13 in our example)
2. If the bit is 1, add the current value of the multiplicand (7 in our example)  
3. Double the multiplicand for the next bit position

This is much more efficient than adding the number to itself repeatedly!

#### Modular Inverse (`mul_inv`)
We use the extended Euclidean algorithm to find multiplicative inverses. This involves keeping track of the coefficients in Bézout's identity while running the Euclidean algorithm. The implementation uses a custom signed integer type to handle negative numbers during the computation. Read more about the algorithm [here](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm).

#### Modular Exponentiation (`pow_mod`)
Similar to multiplication, we use the binary expansion method:
1. Convert the exponent to binary
2. For each 1 bit, multiply by the current value
3. Square the current value at each step

All these operations are wrapped in the `FpElem<T>` struct which represents an element in our finite field. The implementation is generic over any unsigned integer type that implements basic arithmetic operations (defined by the `GenericUInt` trait).

The complete implementation can be found in `fpelem.rs`.

## Elliptic Curves

An elliptic curve is a mathematical object that consists of points in a field satisfying an equation of the form:

\[ y^2 = x^3 + ax + b \]

Where \(a\) and \(b\) are constants that define the shape of the curve. When we work with elliptic curves in cryptography, we use points whose coordinates are elements of our finite field \(\F_p\).

### Point Addition

The most important operation on elliptic curves is point addition. Given two points \(P\) and \(Q\) on the curve, we can define a third point \(R = P + Q\) using the following geometric construction:

1. Draw a line through points \(P\) and \(Q\)
2. Find where this line intersects the curve at a third point
3. Reflect this point across the x-axis

When working in \(\F_p\), this geometric intuition translates into algebraic formulas:

For \(P = (x_1, y_1)\) and \(Q = (x_2, y_2)\), \(R = (x_3, y_3)\) where:

\[ \lambda = \begin{cases} 
\frac{y_2 - y_1}{x_2 - x_1} & \text{if } P \neq Q \\
\frac{3x_1^2 + a}{2y_1} & \text{if } P = Q
\end{cases} \]

then \(R\) in terms of \(\lambda\):

\[ x_3 = \lambda^2 - x_1 - x_2 \]

and

\[ y_3 = \lambda(x_1 - x_3) - y_1 \]

### Properties

Elliptic curve point addition has several important properties:
- It is associative: \((P + Q) + R = P + (Q + R)\)
- It has an identity element (the "point at infinity" - this can come from when both \(x_1=x_2\) and \(y_1 \neq y_2\))
- Every point has an inverse (its reflection across the x-axis)
- Addition is commutative: \(P + Q = Q + P\)


### The Discrete Logarithm Problem

The security of elliptic curve cryptography relies on the difficulty of solving the Elliptic Curve Discrete Logarithm Problem (ECDLP). This problem can be stated as:

Given a point \(G\) on an elliptic curve and another point \(Q = nG\) (where \(nG\) means adding \(G\) to itself \(n\) times), find the value of \(n\).

Importantly:
- We have a "generator point" \(G\)
- We perform "scalar multiplication" by adding \(G\) to itself \(n\) times
- Given only \(G\) and \(Q\), finding \(n\) is computationally infeasible for large values

To be continued...
{.center}

