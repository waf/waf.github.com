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

Haskell's implementation defines a variable that recurses on itself to produce additional values (technically, this is known as "corecursion"). C# does not have concept of recursive variable definitions, but it can recurse on methods. 

C# has the concept of IEnumerables and IEnumerators. An IEnumerable represents a lazy collection, and it has an associated IEnumerator that knows how to get the next value. The ``yield return`` keyword is a shortcut for setting up this relationship. For example, here is how we could create a method that returns a lazy sequence of the numbers 1, 2, and 3:

.. code-block:: csharp

    public IEnumerable<int> Lazy()
    {
        yield return 1;
        yield return 2;
        yield return 3;
    }


IEnumerables also have a rich library of higher-order functions. We'll be using C#'s ``Zip`` for Haskell's ``zipWith``, and ``Skip(1)`` for Haskell's ``tail``.

.. code-block:: csharp

    public IEnumerable<int> Fib()
    {
        var fib = new[] { 1, 1 }.Concat(
            Fib().Zip(Fib().Skip(1), (a, b) => a + b)
        );
        foreach (var item in fib) {
            yield return item;
        }
    }

This implementation is suprisingly concise. There's a couple of rough edges in this implementation:

The most major rough edge stems from the fact that C# is eagerly evaluated and Haskell is lazily evaluated. If C# were lazily evaluated we could directly return the ``fib`` variable from the ``Fib()`` function. This doesn't work in an eagerly evaluated language like C#; we would encounter a stack overflow as we eagerly evaluated our recursive calls. We use ``yield return`` to transform the method into an IEnumerable and IEnumerator interaction, which works around the lack of lazy evaluation in C#.

The proper way to get around this would be to wrap all of our recursive calls in 0-argument lambda expressions. This would be roughly equivalent to the concept of `Haskell's thunks`_. This would require us to write our own library functions to work with 0-argument lambda expressions instead of IEnumerables. While this would be interesting (and may be a future blog post), the above implementation strikes me as a "good enough" solution that is still idiomatic C#.


Fibonacci in Python
===================

Fibonacci in Clojure
====================

.. _Haskell: http://www.haskell.org/haskellwiki/Introduction
.. _Fibonacci series: http://en.wikipedia.org/wiki/Fibonacci_number
.. _Haskell's thunks: http://www.haskell.org/haskellwiki/Thunk
