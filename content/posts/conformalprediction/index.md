+++
title = 'Uncertainty Quantification via Split Conformal Prediction'
date = 2024-12-15T08:00:00-07:00
draft = true
+++
### Preface

This text is based off 

### Motivation

Modern machine learning methods appears hugely effective across many different problems, however we don't know how certain we are about the predictions we make. For example, a self-driving car needs to know when it's uncertain about an object, and medical systems must be able to quantify how "sure" they are about their predictions.

Deep learning is notorious for being overly confident, as can be seen in
add references here later

The question then arises, can we build a framework to quantify uncertainty with minimal assumptions about our models? It turns out the answer is a resounding yes!

### Confidence Intervals

A confidence interval is, informally speaking, an interval which is expected to typically contain the parameter being estimated. When we talk about a confidence level, such as 95%, this tells us how often the interval contains the true value. Think of it this way: if we were to repeat our experiment many times, 95% of the intervals we construct would contain the true value we're trying to estimate. There's an important trade-off here though - while we can get more "confidence" by making our interval wider, this comes at the cost of being less precise about where the parameter actually is.

### The Goal

Given any supervised machine learning algorithm that maps paired training examples to a function,

  $$(X_1,Y_1),\ldots,(X_n,Y_n) \rightarrow \hat{f}_{1:n}$$

and a new data point $X_{n+1}$, we would like to construct a 95% "confidence set" for $Y_{n+1}$.

This is a (random) set $C(X_{n+1})$ where we have that:

  $$\mathbb{P}(Y_{n+1} \in C(X_{n+1})) \geq 0.95$$

Without any assumptions on our learning algorithm, or underlying model this might initially seems impossible! But after some thought you may realise that picking \(C(X_{n+1}) = \R\) always satisfies this, the real questions is whether we can make \(C(X_{n+1})\) "small".

### The Classical MLE Approach

The traditional approach, when we know the underlying distribution family, is to use Maximum Likelihood Estimation (MLE). Let's take linear regression as an example - here we typically assume that $Y = X\beta + \varepsilon$, where $\varepsilon \sim N(0,\sigma^2)$. Using an MLE based method, we can construct asymptotically valid confidence intervals of the form 

  $$\hat{Y} \pm z_{1-\alpha/2}\hat{\sigma}$$

However, this approach comes with some significant caveats. What happens when our distributional assumptions don't match reality? We might encounter non-normal errors, non-constant variance, or even fundamental model misspecification. In these cases, our carefully constructed confidence intervals may no longer be valid.

These results also need infinite amounts of data for the confidence interval to be valid, the issues with this I think are obvious...

<!-- ![buzz](buzz.jpg) -->
<!-- {.center_image} -->

**But we can do better!**
{.center}

### The Magic of Rank Statistics

Imagine we have a collection of random variables $Z_1,\ldots,Z_{n+1}$ that are independent and identically distributed (i.i.d.). What's the probability that $Z_{n+1}$ is the $k$-th largest value among all these variables?

Due to symmetry, all possible orderings are equally likely. Defining \(\text{Rank}(Z_{n+1})\) as the place \(Z_{n+1}\) comes in the ordering, we have that:

$$\mathbb{P}(\text{Rank}(Z_{n+1}) = k) = \frac{1}{n+1}$$

This holds true regardless of the underlying distribution of the $Z_i$ variables!

But we can actually make a stronger statement, we don't actually need the i.i.d. assumption for this to work. We only need a weaker property called exchangeability, which means that for any permutation $\pi$ of the indices, our overall distribution doesn't change, formally this means:

$$(Z_1,\ldots,Z_{n+1}) =_{d}\,\,\, (Z_{\pi(1)},\ldots,Z_{\pi(n+1)})$$

This is a much less restrictive condition than i.i.d. A good example is drawing balls from an urn without replacement. While the draws aren't independent (since each draw affects the probabilities of future draws), they are exchangeable because the order of the draws doesn't affect the likelihood of the balls we pull out.

### Building Better Confidence Intervals

This property of ranks gives us a powerful tool for constructing confidence intervals. If we have $n+1$ exchangeable random variables, we know their ranks must be uniformly distributed. We can use this to build $(1-\alpha)$ confidence intervals by looking at order statistics.

Specifically, we want $Z_{n+1}$ to fall between the $\lceil \frac{\alpha}{2}(n+1) \rceil$-th and $\lfloor (1-\frac{\alpha}{2})(n+1) \rfloor$-th order statistics. The beauty of this approach is that it works for any underlying distribution - no assumptions needed!

### References
1. Vovk, V., Gammerman, A., & Shafer, G. (2005). Algorithmic Learning in a Random World
2. Lei, J., G'Sell, M., Rinaldo, A., Tibshirani, R. J., & Wasserman, L. (2018). Distribution-Free Predictive Inference
