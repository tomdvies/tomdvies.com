---
title: 'Building a barebones website/ theme pair with Hugo'
date: 2024-08-28
draft: false
summary: |
    When looking to build this website I knew I wanted 3 things, 
    ease of setup/ maintenance, no JS, and simplicity. For the first and the last I landed on [Hugo](https://gohugo.io/),
    however I ran into an issue with finding a theme that fit my needs/ wants. This is a blog post on rectifying this (and in the process building my own theme).
---
If you couldn't already tell, I don't love flashy sites, I find the entire concept of libraries like [mathjax](https://www.mathjax.org/) slightly baffling.
The entire internet seems to be convinced that making each viewer of every website render each piece of latex every time they visit a page is a sane way of doing things.
Thankfully, there are tool like [katex](https://katex.org/) which allow for sane *server side* rendering.
