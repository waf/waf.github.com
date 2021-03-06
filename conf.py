# -*- encoding: utf-8 -*-
# This is your configuration file.  Please write valid python!
# See http://posativ.org/acrylamid/conf.py.html

SITENAME = 'Blog - Will Fuqua'
WWW_ROOT = 'https://fuqua.io/blog/'
OUTPUT_DIR = '.'
AUTHOR = 'Will Fuqua'

FILTERS = ['reStructuredText', 'typography', 'h1']
VIEWS = {
    '/': {'filters': 'summarize', 'view': 'index', 'items_per_page': 1000},
    '/:year/:month/:slug/': {'views': ['entry', 'draft']},
    '/tag/:name/': {'filters': 'summarize', 'view':'tag',
                    'pagination': '/tag/:name/:num/'},
    '/atom.xml': {'filters': ['h2', 'nohyphenate'], 'view': 'atom'},
    '/rss.xml': {'filters': ['h2', 'nohyphenate'], 'view': 'rss'},
    '/articles/': {'view': 'archive', 'template': 'articles.html'},
    '/sitemap.xml': {'view': 'sitemap'},
}

THEME = 'theme'
ENGINE = 'acrylamid.templates.jinja2.Environment'
DATE_FORMAT = '%d.%m.%Y, %H:%M'
METASTYLE = 'native'
