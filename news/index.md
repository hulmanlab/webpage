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

{% capture col1 %}

{% include tags.html tags=site.tags %}

{% include list.html data="posts" component="post-excerpt" %}

{% endcapture %}

{% capture col2 %}

<aside>
  <a class="twitter-timeline" href="https://twitter.com/adamhulman?ref_src=twsrc%5Etfw">Tweets by adamhulman</a>
  <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</aside>

{% endcapture %}



{%
  include cols.html
  col1=col1
  col2=col2
%}

