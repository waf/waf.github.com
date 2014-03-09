Haskell's Elegant Fibonacci in Other Languages
##############################################

:date: 2014-03-09
:tags: [haskell, python, clojure, c#, fibonacci]

Haskell_ is a high-level, functional, programming language. Its combination of higher-order functions and lazy evaluation can lead to beautifully elegant algorithm implementations. One such implementation is the `Fibonacci series`_ algorithm:

.. code-block:: haskell

    let fib = 1 : 1 : zipWith (+) fib (tail fib)

This creates a variable called ``fib`` that contains an infinite sequence of Fibonacci numbers. We could print this variable, but our program would start trying to print an infinite number of elements,  rendering it useless. A much better approach is to choose a finite number of elements from the series:

.. code-block:: haskell

    take 10 fib
    [1,1,2,3,5,8,13,21,34,55]

The above implementation of ``fib`` fascinates me, so I decided to try my hand at implementing it in other languages. I chose C#, Python, and Clojure.

Algorithm Explanation
=====================

First, before we can implement this algorithm in other languages, we need to know how it works. We're taking advantage of Haskell's `lazy evaluation`. 

We provide the first two numbers to start off the series. As we request additional elements, Haskell will calculate them recursively, using the ``zipWith`` function. ``zipWith`` takes a function as a parameter, in this case the addition function ``(+)``, and two sequences. It feeds pairs of numbers, one from each sequence, into the addition function. The resulting sum is the next element of our series.

The other function in play is ``tail``, which lops off the first element in a series, and returns everything else. The ``tail`` of ``[1, 2, 3, 4]`` would be ``[2, 3, 4]``.

We combine these two functions to calculate the Fibonacci numbers on demand. Here's a snapshot of the program's state when we calculate the third element, the number 2:

.. code-block:: haskell

    fib                        = 1 : 1 : <unknown>
    (tail fib)                 = 1 : <unknown>
    zipWith (+) fib (tail fib) = 2 : <unknown>

Once we have the third element, we can calculate the fourth element, the number 3:

.. code-block:: haskell

    fib                        = 1 : 1 : 2 : <unknown>
    (tail fib)                 = 1 : 2 : <unknown>
    zipWith (+) fib (tail fib) = 2 : 3 : <unknown>

The core of the implementation uses lazy evaluation of sequences. Most other languages have a similar concept. C# has IEnumerables, Python has itertools, and Clojure has sequences. Additionally, Clojure has macros, which will help us get very close to Haskell's implementation.

Fibonacci in C#
===============

Fibonacci in Python
===================

Fibonacci in Clojure
====================

.. _Haskell: http://www.haskell.org/haskellwiki/Introduction
.. _Fibonacci series: http://en.wikipedia.org/wiki/Fibonacci_number
