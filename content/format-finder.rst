Quick Tip: Format Finder for .NET date strings
##############################################

:date: 2015-02-26
:tags: [csharp, tool, dates]

If you've written C# for any length of time, chances are you've become very familiar with the MSDN documentation pages about `Standard Date and Time Format Strings`_ and `Custom Date and Time Format Strings`_. Any time you need to format a ``DateTime``, those pages are invaluable.

I don't find myself reading those pages often enough to warrant memorizing the strings, but I do read them often enough that it's worth automating the lookup. So I wrote a simple webapp to do it.

.. image:: http://imgs.xkcd.com/comics/automation.png
    :width: 80%
    :align: center

I plan on skewing those curves by sharing this tool. So, here it is: `Format Finder`_.

Format Finder asks gives you a very specific point in time: Monday, March 1st, 2009 at 8:04AM. You then provide the desired output of that date, and Format Finder will provide the formatting strings for you. For example, if you type in ``2009-03-01``, Format Finder will return a custom format string of ``yyyy-MM-dd`` along with a explanation of each part. Alternatively, if you type in ``3/01/2009``, Format Finder will return the standard format string of ``d``.

I hope other people find this as useful as I do. Let's skew that XKCD curve!

.. _Standard Date and Time Format Strings: https://msdn.microsoft.com/en-us/library/az4se3k1(v=vs.110).aspx
.. _Custom Date and Time Format Strings: https://msdn.microsoft.com/en-us/library/8kb3ddd4(v=vs.110).aspx
.. _Format Finder: https://fuqua.io/format-finder/
