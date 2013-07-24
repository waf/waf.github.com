# -*- encoding: utf-8 -*-
# This is your configuration file.  Please write valid python!
# See http://posativ.org/acrylamid/conf.py.html

SITENAME = 'Blog - Will Fuqua'
WWW_ROOT = 'http://fuqua.io/blog/'
OUTPUT_DIR = '.'

FILTERS = ['reStructuredText', 'hyphenate', 'h1']
VIEWS = {
    '/': {'filters': 'summarize', 'view': 'index',
          'pagination': '/page/:num/'},
    '/:year/:slug/': {'views': ['entry', 'draft']},
    '/tag/:name/': {'filters': 'summarize', 'view':'tag',
                    'pagination': '/tag/:name/:num/'},
    '/atom/': {'filters': ['h2', 'nohyphenate'], 'view': 'atom'},
    '/rss/': {'filters': ['h2', 'nohyphenate'], 'view': 'rss'},
    '/articles/': {'view': 'archive', 'template': 'articles.html'},
    '/sitemap.xml': {'view': 'sitemap'},
}

THEME = 'theme'
ENGINE = 'acrylamid.templates.jinja2.Environment'
DATE_FORMAT = '%d.%m.%Y, %H:%M'
METASTYLE = 'native'
