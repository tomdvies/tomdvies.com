---
title: 'Building a barebones website/ theme pair with Hugo'
date: 2024-08-28
draft: false
summary: |
    When looking to build this website I knew I wanted 3 things, 
    ease of setup/ maintenance, no JS, and simplicity. For the first and last point I landed on [Hugo](https://gohugo.io/),
    however I ran into an issue with finding a theme that fit my needs/ wants. This is a blog post on rectifying this.
---
When looking to build this website I knew I wanted 3 things, ease of setup/ maintenance, no JS, and simplicity. 
If you couldn't already tell, I don't love flashy sites. 
I'd much rather a fast loading, small, static site than some massive react esque thing that takes 10 minutes to render.

I landed on [Hugo](https://gohugo.io/), it's many themes, go codebase, and positive reviews online sold me.
However I quickly ran into an issue with finding a theme that fit my needs/ wants. This is a blog post on rectifying this. 
If all you care about is the code, it can all be found on my [github](https://github.com/tomdvies/tomdvies.com). 
This is also very loosely based on the blog post [hugo for fussy people](https://jnolis.com/blog/hugo_for_fussy_people/) by [Jacqueline Nolis](https://jnolis.com/).

### Prereqs/ Starting with a blank theme:
You will need your Hugo version to be >= v0.132.0, for the katex rendering support. We also need a starting point, you can get one by running the following.
```bash
hugo new theme foo
```
This will generate the directory *themes/foo*, 



I find the entire concept of libraries like [mathjax](https://www.mathjax.org/) slightly baffling.
The entire internet seems to be convinced that making each viewer of every website render each piece of latex every time they visit a page is a sane way of doing things.
Thankfully, there are tool like [katex](https://katex.org/) which allow for sane *server side* rendering.

