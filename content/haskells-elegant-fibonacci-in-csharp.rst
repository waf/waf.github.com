Haskell's Elegant Fibonacci Implementation in C#
################################################

:date: 2014-03-11
:permalink: /2014/03/haskells-elegant-fibonacci-in-csharp/
:tags: [haskell, csharp, fibonacci, functional]

Haskell_ is a high-level, functional, programming language. Its combination of higher-order functions and lazy evaluation can lead to beautifully elegant algorithm implementations. One such implementation is the `Fibonacci series`_ algorithm:

.. code-block:: haskell

    let fib = 1 : 1 : zipWith (+) fib (tail fib)

This creates a variable called ``fib`` that contains an infinite sequence of Fibonacci numbers. We could print this variable, but our program would start trying to print an infinite number of elements,  rendering it useless. A much better approach is to choose a finite number of elements from the series:

.. code-block:: haskell

    take 10 fib
    [1,1,2,3,5,8,13,21,34,55]

The above implementation of ``fib`` fascinates me, so I decided to try my hand at implementing it in another, less-functional language: C#.

Algorithm Explanation
=====================

First, before we can implement this Fibonacci algorithm in C#, we need to know how the algorithm works. Here's the Haskell version again:

.. code-block:: haskell

    let fib = 1 : 1 : zipWith (+) fib (tail fib)

We provide the first two numbers to start off the series. As we request additional elements, Haskell will calculate them corecursively_, using the ``zipWith`` function. ``zipWith`` takes a function as a parameter, in this case the addition function ``(+)``, and two sequences. It feeds pairs of elements, one from each sequence, into the addition function. The result is a single sequence made from combining or "zipping together" the input sequences.

The other function in play is ``tail``, which returns everything but the first element of the list. The ``tail`` of ``[1, 2, 3, 4]`` would be ``[2, 3, 4]``.

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

The core of the implementation uses lazy evaluation of sequences. Even though we're setting up infinite recursion, if we ask for the first 10 fibonacci numbers, our program will only recurse 8 times (since we provided the first 2 values).

Idiomatic C# Version
================================

In our initial C# implementation we'll rely on IEnumerables and IEnumerators. An IEnumerable represents a lazy sequence, and it has an associated IEnumerator that knows how to get the next value for the sequence. The ``yield return`` keyword is a shortcut for setting up this relationship. For example, here is how we could create a method that returns a lazy sequence of the numbers 1, 2, and 3:

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

This works, but if you run this function you'll find that it's incredibly slow. Our ``Fib()`` function is being repeatedly evaluated as we recurse.

This is a tricky problem to solve; As it stands now, if we request a value from our IEnumerable, the associated IEnumerator will perform a recursive calculation to obtain the value. When we request the next value, the recursive calculation will start all over again. Ideally, our calculation would use the previously calculated values in it's current calculation.

Introducing Thunks and Recursive Data Definitions
=================================================

There are two core problems with our attempt:

#. Haskell is a lazily evaluated language, and C# is eagerly evaluated. 
#. Haskell's ``fib`` implementation defines a variable that recurses on itself to produce additional values. C# does not have the concept of recursive variable definitions.
   
We can get lazy behavior in C# by wrapping our operations in a 0-argument lambda expression, then evaluating the lambda expression when we need the value. This "lazy operation" is called a thunk_. Haskell uses thunks to defer evaluation, too (the actual Haskell thunk implementation is more involved, but a 0-argument lambda expression captures the essence of the idea).

Let's thunk-ify our two arguments to ``Concat()``. Since each thunk is a 0-argument lambda that resolves to an IEnumerable of integers, both thunks will have the type signature ``Func<IEnumerable<int>>``.

.. code-block:: csharp

    public static IEnumerable<int> Fib()
    {
        Func<IEnumerable<int>> seedThunk = 
            () => new[] { 1, 1 };
        Func<IEnumerable<int>> zipThunk = 
            () => fib.Zip(fib.Skip(1), (a, b) => a + b);

        var fib = seedThunk.Concat(zipThunk);
        foreach (var item in fib) {
            yield return item;
        }
    }

Uh-oh, this doesn't compile! All of the IEnumerable methods, including ``Concat()``, expect IEnumerables, not thunks. Luckily, we can use C#'s extension method system to add thunk support:

.. code-block:: csharp

    public static IEnumerable<T> Concat<T>(
        this Func<IEnumerable<T>> first, 
        Func<IEnumerable<T>> second)
    {
        foreach (var item in first()) 
            yield return item;
        foreach (var item in second()) 
            yield return item;
    }

Our ``Fib()`` method is quite a bit harder to read, so what did it gain us? With our arguments being lazily evaluated, we can remove the function recursion and ``yield return`` statements, and replace them with a neat trick that simulates recursive variable definitions:

.. code-block:: csharp

    public static IEnumerable<int> Fib()
    {
        IEnumerable<int> fib = null;

        Func<IEnumerable<int>> seedThunk = 
            () => new[] { 1, 1 };
        Func<IEnumerable<int>> zipThunk = 
            () => fib.Zip(fib.Skip(1), (a, b) => a + b);

        // reassign fib, changing the implementation zipThunk depends on
        fib = seedThunk.Concat(zipThunk);
        return fib;
    }

Isn't that cool (or is it terrifying)? Our thunks, which are closures, capture the reference to the ``fib`` variable, which is initially null. Then, we assign the result of the expression back to ``fib``, changing the implementation to which the captured ``fib`` refers. This is how we can use lazy evaluation to fake recursive data definitions.

Finally, now that we're just dealing with an IEnumerable, it's easy to memoize it.

Rather than writing our own memoizing IEnumerable code, let's use the one available in `Interactive Extensions`_, part of the `Rx Project`_. We can pass our Enumerable into the library's ``Memoize`` function: 

.. code-block:: csharp

    public static IEnumerable<int> Fib()
    {
        IEnumerable<int> fib = null;

        Func<IEnumerable<int>> seedThunk = 
            () => new[] { 1, 1 };
        Func<IEnumerable<int>> zipThunk = 
            () => fib.Zip(fib.Skip(1), (a, b) => a + b);

        fib = EnumerableEx.Memoize(seedThunk.Concat(zipThunk));
        return fib;
    }

At this point we're done! We have a lazily-evaluated, infinite Fibonacci sequence that is defined in terms of itself. Here's the full working code! 

.. code-block:: csharp

    using System;
    using System.Linq;
    using System.Collections.Generic;

    namespace Fibonacci
    {
        // Uses http://www.nuget.org/packages/ix_experimental-main
        // for memoization
        class MainClass
        {
            public static void Main(string[] args) 
            {
                IEnumerable<int> fib = null;

                Func<IEnumerable<int>> seedThunk = 
                    () => new[] { 1, 1 };
                Func<IEnumerable<int>> zipThunk = 
                    () => fib.Zip(fib.Skip(1), (a, b) => a + b);

                fib = EnumerableEx.Memoize(seedThunk.Concat(zipThunk));

                var first30 = fib.Take(30);

                Console.WriteLine(String.Join(",", first30));
            }
        }

        public static class LazyExtensions
        {
            public static IEnumerable<T> Concat<T>(
                this Func<IEnumerable<T>> first, 
                Func<IEnumerable<T>> second)
            {
                foreach (var item in first()) 
                    yield return item;
                foreach (var item in second()) 
                    yield return item;
            }
        }
    }

        
.. _Haskell: http://www.haskell.org/haskellwiki/Introduction
.. _Fibonacci series: http://en.wikipedia.org/wiki/Fibonacci_number
.. _thunk: http://www.haskell.org/haskellwiki/Thunk
.. _Rx Project: https://rx.codeplex.com/
.. _Interactive Extensions: http://www.nuget.org/packages/ix_experimental-main
.. _memoization: http://en.wikipedia.org/wiki/Memoization
.. _corecursively: http://en.wikipedia.org/wiki/Corecursion
