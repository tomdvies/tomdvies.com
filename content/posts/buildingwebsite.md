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

After picking Hugo, I started to go through themes, however they all either included features I really didn't want, or were too basic. 
So I ended up deciding to start from scratch

### Prereqs/ Starting with a blank theme
You will need your Hugo version to be >= v0.132.0, for the katex rendering support. We also need a starting point, you can get one by running the following.
```bash
hugo new theme foo
```
This will generate the directory *themes/foo*, I then built my website ontop of the one provided (this might be bad?), but it is still useable as a theme.
I also cleared out all the included JS, as I didn't want any in my site. Now, I was ready to start building.

### Setting up server side latex rendering via katex
As an aside, I find the entire concept of libraries like [mathjax](https://www.mathjax.org/) slightly baffling.
The entire internet seems to be convinced that making every user of every website render each piece of latex every time they visit a page is a sane way of doing things, despite the rednered latex looking the same on all devices.
Thankfully, there are tool like [katex](https://katex.org/) which allow for sensible *server side* rendering. Hugo recently added support for this feature in [v0.132.0](https://github.com/gohugoio/hugo/releases/tag/v0.132.0)
To do this, I added the hook *layouts/_default/_markup/render-passthrough.html*, as follows. 
```go-html-template
{{ if eq .Type "block" }}
  {{ $opts := dict "displayMode" true }}
  {{ transform.ToMath .Inner $opts }}
{{ else if eq .Type "inline"}}
  {{ transform.ToMath .Inner }}
{{ end }}
```
This tells hugo, to convert the block/ inline latex respectively. We also need to provide some delimiters in the config file to use this in markdown, so in my *hugo.toml* I added.
```toml
[markup]
  [markup.goldmark]
    [markup.goldmark.extensions]
      [markup.goldmark.extensions.passthrough]
        enable = true
        [markup.goldmark.extensions.passthrough.delimiters]
          block = [['\[', '\]'], ['$$', '$$']]
          inline = [['\(', '\)']]
  [markup.goldmark.parser]
      [markup.goldmark.parser.attribute]
        block = true
```
This allows us to use the \\( \\) delimiters for inline latex, and \$$ \$$, \\[\\] for block latex. 
Finally, I added the katex css file to *layouts/partials/head.html*, this is required for server side rendered katex to display properly.
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
```
The following is an example of using the delimiters in your markdown vs how its rendered.
```md
inline math: 
\(\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}\)

block math:
\[\lim_{x\to 0}\frac{\sin(x)}{\x} = 1\]
```
is rendered as
> ***inline math*** : 
\(\int_{-\infty}^{\infty}e^{-x^2} dx = \sqrt{\pi}\)
>
> ***block math***:
>\[\lim_{x\to 0}\frac{\sin(x)}{x} = 1\]

Note that if you refresh the page, there isn't the lag where you can see the raw latex that comes with rendering on the fly. Now that we have latex support setup we're half the way 
to being done (this was the only "frill" I wanted my site to have). Now we can work on *themeing* the site.

### Customise your css/ layouts
