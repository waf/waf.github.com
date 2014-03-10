Haskell's Elegant Fibonacci in C# and Clojure
#############################################

:date: 2014-03-09
:permalink: /2014/03/haskells-elegant-fibonacci-in-csharp-and-clojure/
:tags: [haskell, clojure, c#, fibonacci]

Haskell_ is a high-level, functional, programming language. Its combination of higher-order functions and lazy evaluation can lead to beautifully elegant algorithm implementations. One such implementation is the `Fibonacci series`_ algorithm:

.. code-block:: haskell

    let fib = 1 : 1 : zipWith (+) fib (tail fib)

This creates a variable called ``fib`` that contains an infinite sequence of Fibonacci numbers. We could print this variable, but our program would start trying to print an infinite number of elements,  rendering it useless. A much better approach is to choose a finite number of elements from the series:

.. code-block:: haskell

    take 10 fib
    [1,1,2,3,5,8,13,21,34,55]

The above implementation of ``fib`` fascinates me, so I decided to try my hand at implementing it in two other programming languages: C# and Clojure.

Algorithm Explanation
=====================

First, before we can implement this algorithm in other languages, we need to know how it works. Here's the algorithm again:

.. code-block:: haskell

    let fib = 1 : 1 : zipWith (+) fib (tail fib)

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

The core of the implementation uses lazy evaluation of sequences. Even though we're setting up infinite recursion, if we ask for the first 10 fibonacci numbers, our program will only recurse 8 times (since we provided the first 2 values). Most other languages have some sort of lazy sequence concept: C# has IEnumerables and Clojure has sequences. Additionally, Clojure has macros, which will help us get very close to Haskell's implementation.

Fibonacci in C#
===============

Haskell's implementation defines a variable that recurses on itself to produce additional values (technically, this is known as "corecursion"). C# does not have concept of recursive variable definitions, but it can recurse on methods. 

In our initial implementation we'll rely on IEnumerables and IEnumerators. An IEnumerable represents a lazy sequence, and it has an associated IEnumerator that knows how to get the next value for the sequence. The ``yield return`` keyword is a shortcut for setting up this relationship. For example, here is how we could create a method that returns a lazy sequence of the numbers 1, 2, and 3:

.. code-block:: csharp

    public IEnumerable<int> Lazy()
    {
        yield return 1;
        yield return 2;
        yield return 3;
    }


IEnumerables come with a rich library of higher-order functions out of the box. We'll be using IEnumerable's ``Zip`` method for Haskell's ``zipWith`` function, and the ``Skip`` method for Haskell's ``tail`` function. Here's a first pass:

.. code-block:: csharp

    public static void Main(string[] args)
    {
        var fibonacci = Fib();
        var first10 = fibonacci.Take(10);
    }

    public static IEnumerable<int> Fib()
    {
        var fib = new[] { 1, 1 }.Concat(
            Fib().Zip(Fib().Skip(1), (a, b) => a + b)
        );
        foreach (var item in fib) {
            yield return item;
        }
    }

This is a good start, but if we run it, we'll see that it's much slower than the Haskell version. This is due to the constant reevaluation of the ``Fib()`` function, which leads to terrible performance. Haskell can be more intelligent about this since it doesn't have to worry about mutability; it only evaluates ``fib`` once, and subsequent iterations use the result of this immutable evaluation.

We could achieve this in our C# version by writing our own memoizing IEnumerable implementation, but let's just use the one available in `Interactive Extensions`_, part of the `Rx Project`_. We can pass our Enumerable into the library's ``Memoize`` function:

.. code-block:: csharp

    private static IEnumerable<int> fibm = EnumerableEx.Memoize(Fib());
    public static IEnumerable<int> Fib()
    {
        var fib = new[] { 1, 1 }.Concat(
            fibm.Zip(fibm.Skip(1), (a, b) => a + b)
        );
        foreach (var item in fib) {
            yield return item;
        }
    }

Now our performance is comparable to the Haskell implementation.


Fibonacci in Clojure
====================

.. code-block:: clojure

    (def fib
      (lazy-cat [1 1] (map + (rest fib) fib)))

    (println (take 50 fib))

.. _Haskell: http://www.haskell.org/haskellwiki/Introduction
.. _Fibonacci series: http://en.wikipedia.org/wiki/Fibonacci_number
.. _Haskell's thunks: http://www.haskell.org/haskellwiki/Thunk
.. _Rx Project: https://rx.codeplex.com/
.. _Interactive Extensions: http://www.nuget.org/packages/ix_experimental-main
