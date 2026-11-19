---
# create lunr store for search page
---
{% if site.data.theme.search-child-objects == true %}
{%- assign items = site.data[site.metadata] | where_exp: 'item','item.objectid' -%}
{% else %}
{%- assign items = site.data[site.metadata] | where_exp: 'item','item.objectid and item.parentid == nil' -%}
{% endif %}
{%- assign fields = site.data.config-search -%}
{%- assign marcadores_vacios = '|n/a|s/f|s/i|[anonimo]|[anónimo]|anonimo|anónimo|sin fecha|s/d|n/d|' -%}
var store = [ 
{%- for item in items -%} 
{  
{% for f in fields %}{%- assign valor = item[f.field] | default: '' | strip -%}{%- assign clave = valor | downcase | prepend: '|' | append: '|' -%}{% if valor == '' or marcadores_vacios contains clave %}{% if f.field == 'title' %}{{ f.field | jsonify }}: {{ item.objectid | prepend: 'Panfleto ' | jsonify }},{% endif %}{% else %}{{ f.field | jsonify }}: {{ item[f.field] | normalize_whitespace | replace: '""','"' | jsonify }},{% endif %}{% endfor %} 
"id": {% if item.parentid %}{{ item.parentid | append: '.html#' | append: item.objectid | jsonify }}{% else %}{{item.objectid | append: '.html' | jsonify }}{% endif %}

}{%- unless forloop.last -%},{%- endunless -%}
{%- endfor -%}
];
