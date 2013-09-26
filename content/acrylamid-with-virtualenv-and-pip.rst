Acrylamid with virtualenv and pip
########################################################

:date: 2013-09-10
:tags: [acrylamid, blog, python]

Every two years or so, I decide that I should probably have a tech blog, even if it's just a place for me to post notes on languages and systems I'm experimenting with. 
That time has rolled around again, so I spent some time playing with Acrylamid_, a *static blog generator* written in Python. From Acrylamid's website:

    With Acrylamid you can write your weblog entries with your editor of choice in Markdown, reStructuredText or textile. With several content filters you can pimp your HTML (typography, math, hyphenation). Acrylamid provides a very sophisticated CLI and integrates perfectly with any DVCes. It generates completely static HTML you can host everywhere.

As of September 2013, the Acrylamid website recommends using the older easy_install installation method, but I much prefer to use a standard virtualenv/pip-based setup. I've detailed the installation and configuration steps below.

Up and Running
==============

The first thing we need to do is install virtualenv_. You can find the virtualenv command in your OS's repositories. Make sure you get the Python2 version, as Acrylamid is a Python2 application.

After we have virtualenv installed, let's use it to create our empty Python virtual environment: 

.. code-block:: console

    > virtualenv2 blog-project
    New python executable in blog-project/bin/python2
    Also creating executable in blog-project/bin/python
    Installing setuptools............done.
    Installing pip...............done.
    > cd blog-project
    > source bin/activate

If you're not familiar with Python virtual environments, all we're doing here is creating a directory (called ``blog-project``) that has a self-contained set of Python packages. This way, when we install Acrylamid and its supporting packages, they are installed into the ``blog-project`` directory, and not system-wide. When we source the ``bin/activate`` script it modifies the ``$PATH`` variable to point to the ``blog-project`` Python libraries. This ``$PATH`` modification only lasts for the duration of your terminal session.

Now, let's install Acrylamid and create our blog. For more information on what's going on here, check out Acrylamid's `getting started guide`_.

.. code-block:: console

    > pip install acrylamid
    > acrylamid init myblog
    create  myblog/content/sample-entry.txt
    create  myblog/theme/base.html
    create  myblog/theme/main.html
    create  myblog/theme/entry.html
    create  myblog/theme/articles.html
    create  myblog/theme/atom.xml
    create  myblog/theme/rss.xml
    create  myblog/theme/style.css
    create  myblog/conf.py
    Created your fresh new blog at 'myblog'. Enjoy!
    > acrylamid autocompile
    * Running on http://127.0.0.1:8000/

At this point we have a fully-functioning static blog served up on port 8000! Next step? Configuration! 

Adding some Flare
=================

Acrylamid has great, in-depth `configuration documentation`_. There are a couple of filters and modules we can install via pip into our virtualenv environment:

reStructuredText
----------------

Acrylamid uses Markdown by default for the authoring of blog posts. However, the `reStructuredText`_ filter includes some nice features, such as easy Gist, YouTube, and Vimeo embedding. We can switch over to reStructuredText by installing the docutils package:

.. code-block:: console
    
    > pip install docutils

Now, find the filters list in ``conf.py`` and replace Markdown with reStructuredText:

.. code-block:: python

    FILTERS = ['reStructuredText', 'hyphenate', 'h1']

Syntax Highlighting
-------------------

We can add code syntax highlighting to our blog by installing `Pygments`_: 

.. code-block:: console
    
    > pip install pygments

Next, type some code into a blog post and designate it as a code-block. Pygments will parse our code-blocks and add CSS classes to individual tokens. To designate a code-block in reStructuredText, use the syntax:

.. code-block:: reStructuredText

    .. code-block:: python

        def foo():
            return "foo"

We'll want to grab a Pygments theme, which is just a CSS file. Phil Tysoe has a good `list of themes`_ on his blog, though we need to rename the wrapper class from ``codehilite`` to the class that Acrylamid uses, ``highlight``. Include the CSS file in your Acrylamid theme.

Advanced Typography
-------------------

Since we're authoring our blog in a text editor, it can be challenging to include proper punctuation like em/en dashes and ellipses. To fix this we can enable the 'typography' filter, which will add these typographical flares to our text. For example, it replaces three periods with an ellipsis, and replaces two hyphens with an en dash. 

All we have to do is install the smartypants module, and add the filter to our ``conf.py``.

.. code-block:: console
    
    > pip install smartypants

.. code-block:: python

    FILTERS = ['reStructuredText', 'hyphenate', 'typography', 'h1']

What's next?
============

I've covered a few of the more interesting Acrylamid customization options and Python modules, but there are many, many more. Take a look at the `Acrylamid filter documentation`_ for an exhaustive list!

.. _Acrylamid: http://posativ.org/acrylamid/
.. _Acrylamid filter documentation: http://posativ.org/acrylamid/filters.html
.. _virtualenv: https://pypi.python.org/pypi/virtualenv
.. _GitHub Pages: http://pages.github.com/
.. _Markdown: http://en.wikipedia.org/wiki/Markdown
.. _reStructuredText: http://en.wikipedia.org/wiki/Markdown
.. _Jinja2: http://jinja.pocoo.org/docs/
.. _configuration documentation:  http://posativ.org/acrylamid/conf.py.html
.. _getting started guide: http://posativ.org/acrylamid/usage.html
.. _list of themes: http://igniteflow.com/pygments/themes/
.. _Pygments: http://pygments.org/
