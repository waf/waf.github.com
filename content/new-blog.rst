New Blog — Powered by Acrylamid
######################################

:date: 2013-07-24
:tags: [acrylamid, blog, python]

Every two years or so, I decide that I should probably have a tech blog, even if it's just a place for me to post notes on languages and systems I'm experimenting with. 
That time has rolled around again, so I spent some time playing with Acrylamid_, a *static blog generator*. 

Typically, a blog is hosted on a webserver that runs a server-side language such as Ruby or PHP. That language is used to read a blog post from a database and generate the HTML that is sent to the browser. However, a *static blog generator* gets rid of the need for a server-side language entirely; the blog author writes a post on his or her computer, the static blog generator creates HTML from that post, and then the HTML is uploaded to the webserver. This allows the webserver to be very simple and fast, thus making free hosting options such as `GitHub Pages`_ available.

It's incredibly easy to get up and running with Acrylamid. It's written in Python 2 (with a Python 3 version in the works), and leverages existing, popular, and time-tested Python libraries.

To get started, let's create a `python virtual environment`_, into which we'll install Acrylamid:

.. code-block:: console

    > virtualenv2 my-sample-blog
    New python executable in my-sample-blog/bin/python2
    Also creating executable in my-sample-blog/bin/python
    Installing setuptools............done.
    Installing pip...............done.
    > cd blog
    > source bin/activate

.. code-block:: console

    > pip install acrylamid
    > acrylamid

.. _Acrylamid: http://posativ.org/acrylamid/
.. _python virtual environment: https://pypi.python.org/pypi/virtualenv
.. _GitHub Pages: http://pages.github.com/
