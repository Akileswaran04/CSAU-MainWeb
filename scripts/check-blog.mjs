// Checks the blog article sanitizer and topic mapping in src/lib/blog.ts.
// Run: node scripts/check-blog.mjs   (Node 23.6+ strips the TypeScript types)
import assert from "node:assert/strict";
import { readArticle, topicsOf } from "../src/lib/blog.ts";

const raw = `<figure><img src="https://cdn-images-1.medium.com/max/1024/0*cover.png"></figure>
<h3>Intro</h3><p onclick="x()">Hi <a href="javascript:alert(1)">bad</a> <a href="https://ok.dev" style="c">ok</a></p>
<script>alert(1)</script><iframe src="https://evil"></iframe><h4>Intro</h4>
<img src="x" onerror="alert(1)"><img src='https://a.b/c.png' alt='say "hi"'>
<img src="https://medium.com/_/stat?event=post.clientViewed" width="1">`;

const { html, toc } = readArticle(raw, "https://cdn-images-1.medium.com/max/875/0*cover.png");
assert.ok(!/script|iframe|onclick|onerror|javascript:|style=|_\/stat|cover\.png/.test(html), html);
assert.ok(html.includes('<a href="https://ok.dev" target="_blank" rel="noopener noreferrer">ok</a>'), html);
assert.ok(html.includes('<img src="https://a.b/c.png" alt="say &quot;hi&quot;"'), html);
assert.ok(html.includes('<a target="_blank" rel="noopener noreferrer">bad</a>'), html);
assert.deepEqual(toc, [
  { id: "intro", text: "Intro", level: 2 },
  { id: "intro-2", text: "Intro", level: 3 },
]);

assert.deepEqual(topicsOf(["ai", "data-science"]), ["AI & ML"]);
assert.deepEqual(topicsOf(["nodejs", "backend-development"]), ["Web Development"]);
assert.deepEqual(topicsOf(["ai", "technology", "chatbots"]), ["Technology", "AI & ML"]);
assert.deepEqual(topicsOf(["roadmaps"]), ["Technology"]);
assert.deepEqual(topicsOf(["html"]), ["Web Development"]);
console.log("blog checks pass");
