---
title: "Example draft: how to write a blog post"
description: "A template that shows how blog posts are written and laid out. It is a draft, so it is not listed on the blog or indexed by search engines."
author: "Home & Online Tutor Hub"
authorType: organization
date: 2026-11-11
city: noida
draft: true
---

This is an example draft. It shows how a post looks on the site. It is not listed on the blog, it is not in the sitemap, and search engines are told not to index it.

## How to write a new post

1. Copy this file in `frontend/content/blog/` and rename it. The file name becomes the address: `choosing-a-tutor.md` is published at `/blog/choosing-a-tutor`.
2. Fill in the details between the `---` lines at the top:
   - **title**: up to about 50 characters, so the page title stays within 60.
   - **description**: one or two sentences, at most 155 characters. Search results show it.
   - **author**, and **authorType** (`person` or `organization`).
   - **date** (YYYY-MM-DD), and **updated** when you change the post later.
   - **city**: `noida` or `delhi` to end the post with a box for that city's tutors. Leave it out for a box with every city.
   - **draft**: `true` while you are writing. Remove the line, or set it to `false`, to publish.
3. Write the post below the second `---` in Markdown: `##` for headings, `-` for lists, `**bold**` and `[links](/noida)`.
4. Run `npm run build` in `frontend/` and open the post to check it, then run `npm run check:seo`.

## Writing tips

- Write for parents: short sentences and practical advice.
- Do not state fees, results or marks we cannot promise.
- Link to the city page the post is about.
