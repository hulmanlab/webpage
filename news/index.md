---
title: News
nav:
  order: 4
  tooltip: News, announcements...
---

# {% include icon.html icon="fa-solid fa-feather-pointed" %}News

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

{% include section.html %}

{%
  include float.html
  content=<a class="twitter-timeline" data-width="350" data-height="1250" href="https://twitter.com/adamhulman?ref_src=twsrc%5Etfw">Tweets by adamhulman</a> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
  flip=true
%}

{% include tags.html tags=site.tags %}

{% include list.html data="posts" component="post-excerpt" %}


{% include float.html clear=true %}
