AUTHOR = 'Will Fuqua'
SITENAME = 'Blog - Will Fuqua'
SITEURL = 'https://fuqua.io'

PATH = 'blog-input'
OUTPUT_PATH = '.'

TIMEZONE = 'Asia/Bangkok'

DEFAULT_LANG = 'en'
TYPOGRIFY = True
THEME = 'theme'

ROOT_URL = '/blog'
ROOT = 'blog'
THEME_STATIC_DIR =      ROOT
INDEX_SAVE_AS =         ROOT + '/index.html'
ARTICLE_URL =           ROOT + '/{date:%Y}/{date:%m}/{slug}/'
ARTICLE_SAVE_AS =       ROOT + '/{date:%Y}/{date:%m}/{slug}/index.html'
MONTH_ARCHIVE_SAVE_AS = ROOT + '/{date:%Y}/{date:%m}/index.html'
YEAR_ARCHIVE_SAVE_AS =  ROOT + '/{date:%Y}/index.html'
TAGS_SAVE_AS =          ROOT + '/tag/index.html'
TAG_URL =               ROOT + '/tag/{slug}/'
TAG_SAVE_AS =           ROOT + '/tag/{slug}/index.html'

CATEGORIES_SAVE_AS = ''
CATEGORY_URL =       ''
CATEGORY_SAVE_AS =   ''
ARCHIVES_SAVE_AS =   ''
AUTHORS_SAVE_AS =    ''
AUTHOR_SAVE_AS =     ''

SLUG_REGEX_SUBSTITUTIONS = [
    (r'C#', 'csharp'),
    (r'[^\w\s-]', ''),  # remove non-alphabetical/whitespace/'-' chars
    (r'(?u)\A\s*', ''),  # strip leading whitespace
    (r'(?u)\s*\Z', ''),  # strip trailing whitespace
    (r'[-\s]+', '-'),  # reduce multiple whitespace or '-' to single '-'
]

# Feed generation is usually not desired when developing
FEED_DOMAIN = SITEURL
FEED_MAX_ITEMS = 10
FEED_ALL_ATOM = ROOT + '/feed.atom.xml'
CATEGORY_FEED_ATOM = None
TRANSLATION_FEED_ATOM = None
AUTHOR_FEED_ATOM = None
AUTHOR_FEED_RSS = None

# Blogroll
#LINKS = (('Pelican', 'https://getpelican.com/'),
#         ('Python.org', 'https://www.python.org/'),
#         ('Jinja2', 'https://palletsprojects.com/p/jinja/'),
#         ('You can modify those links in your config file', '#'),)

# Social widget
#SOCIAL = (('You can add links in your config file', '#'),
#          ('Another social link', '#'),)
TYPOGRIFY = True
TYPOGRIFY_DASHES = 'oldschool'

DEFAULT_PAGINATION = False

# Uncomment following line if you want document-relative URLs when developing
RELATIVE_URLS = True
