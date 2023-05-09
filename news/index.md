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

{% capture content %}
  <a class="twitter-timeline" data-width="350" href="https://twitter.com/adamhulman?ref_src=twsrc%5Etfw">Tweets by adamhulman</a> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
{% endcapture %}

{%
  include float.html
  content=content
  flip=true
%}

{% include tags.html tags=site.tags %}

## Event

For the upcoming events, we have Talens club, for students who wants to colaborate with the laboratory, Journal club.....

## Launching our website

Our group members represent a wide range of scientific profiles from data science, mathematics to sport science and medicine. We aim to combine our skills in interdisciplinary projects and then communicate our findings to both research communities.


{% include float.html clear=true %}
