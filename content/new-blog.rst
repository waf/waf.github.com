New Blog — Powered by Acrylamid
###############################

:date: 2013-07-24
:tags: [acrylamid, blog, python]

Every two years or so, I decide that I should probably have a tech blog, even if it's just a place for me to post notes on languages and systems I'm experimenting with. 
That time has rolled around again, so I spent some time playing with Acrylamid_, a *static blog generator*, written in Python. 

As of August 2013, the Acrylamid website recommends using the older easy_install installation method, but I prefer to use a virtualenv/pip based install. I've detailed the installation. 

What's a Static Blog Generator?
===============================

Typically, a blog is hosted on a webserver that runs a server-side language such as Ruby or PHP. That language is used to read a blog post from a database and generate the HTML that is sent to the browser. However, a *static blog generator* gets rid of the need for a server-side language entirely; the blog author writes a post on his or her computer, the static blog generator creates HTML from that post, and then the HTML is uploaded to the webserver. This allows the webserver to be very simple and fast, thus making free hosting options such as `GitHub Pages`_ available.

Up and Running
==============

To get started, let's create our empty `python virtual environment`_: 

.. code-block:: console

    > virtualenv2 blog-project
    New python executable in blog-project/bin/python2
    Also creating executable in blog-project/bin/python
    Installing setuptools............done.
    Installing pip...............done.
    > cd blog-project
    > source bin/activate

If you're not familiar with python virtual environments, all we're doing here is creating a directory (called ``blog-project``) that has a self-contained set of python packages. This way, when we install Acrylamid, we're only installing it into this directory, and not system-wide. You can find the virtualenv command in your OS's repositories. Make sure you get the python2 version, as Acrylamid is a python2 application.

Now, let's install Acrylamid into our virtual environment and create a new blog, imaginatively named 'blog':

.. code-block:: console

    > pip install acrylamid
    > acrylamid init blog
    create  blog/content/sample-entry.txt
    create  blog/theme/base.html
    create  blog/theme/main.html
    create  blog/theme/entry.html
    create  blog/theme/articles.html
    create  blog/theme/atom.xml
    create  blog/theme/rss.xml
    create  blog/theme/style.css
    create  blog/conf.py
    Created your fresh new blog at 'blog'. Enjoy!

Acrylamid created three things for us:

- conf.py --- the configuration file for Acrylamid.
- the content directory --- this is where we'll place blog posts, one post per file. By default we write in the Markdown_ format.
- the theme directory --- this holds our template files used to generate the HTML. By default this uses Jinja2_ templating.

There's one last step: we have all the source files for our blog, we just need to generate the actual HTML! We can generate the HTML and fire up a development web server by running the command:

.. code-block:: console

    > acrylamid autocompile

This will serve up our files on port 8000, and regenerate the HTML whenever the source files change. 

At this point we have a fully-functioning static blog! The generated HTML files are in the newly-created ``output`` directory, and these HTML files can be published wherever we want. Now would be a good time to explore the conf.py file, where we can change the blog title and author, as well as quite a few other `interesting customizations`_.

.. _Acrylamid: http://posativ.org/acrylamid/
.. _python virtual environment: https://pypi.python.org/pypi/virtualenv
.. _GitHub Pages: http://pages.github.com/
.. _Markdown: http://en.wikipedia.org/wiki/Markdown
.. _Jinja2: http://jinja.pocoo.org/docs/
.. _interesting customizations: http://posativ.org/acrylamid/conf.py.html
