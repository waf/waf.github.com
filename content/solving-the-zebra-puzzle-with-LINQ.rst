Solving the Zebra Puzzle with LINQ and C# 7
###########################################

:date: 2017-01-02
:tags: [csharp]

I recently ran across `the Zebra Puzzle`_, a logic puzzle from about 50 years ago:

    1. There are five houses.
    2. The Englishman lives in the red house.
    3. The Spaniard owns the dog.
    4. Coffee is drunk in the green house.
    5. The Ukrainian drinks tea.
    6. The green house is immediately to the right of the ivory house.
    7. The Old Gold smoker owns snails.
    8. Kools are smoked in the yellow house.
    9. Milk is drunk in the middle house.
    10. The Norwegian lives in the first house.
    11. The man who smokes Chesterfields lives in the house next to the man with the fox.
    12. Kools are smoked in the house next to the house where the horse is kept.
    13. The Lucky Strike smoker drinks orange juice.
    14. The Japanese smokes Parliaments.
    15. The Norwegian lives next to the blue house.

    Now, who drinks water? Who owns the zebra?

This problem is a bit of a pain to solve by hand, so it's no surprise that there's `a long list of programs available to solve it`_. If you look at the C# solution on that page, you may be dismayed at how long and enterprisey it is. It clocks in at about 450 lines, using the Microsoft Solver Foundation. While it gets points for using a logic engine, the code is pretty unreadable.

`Peter Norvig`_ wrote a solution in Python, which is available in his `Udacity CS212`_ course. I've reproduced it here. The numbered comments refer to the corresponding requirement number from the original problem description.

.. code-block:: python

    import itertools

    def zebra_puzzle():
        "Return a tuple (WATER, ZEBRA) indicating their house numbers."
        houses = first, _, middle, _, _ = [1, 2, 3, 4, 5] #1
        orderings = list(itertools.permutations(houses))
        return next((WATER, ZEBRA)
                for (red, green, ivory, yellow, blue) in orderings
                if imright(green, ivory)      #6
                for (Englishman, Spaniard, Ukranian, Japanese, Norwegian) in orderings
                if Englishman is red          #2
                if Norwegian is first         #10
                if nextto(Norwegian, blue)    #15
                for (coffee, tea, milk, oj, WATER) in orderings
                if coffee is green            #4
                if Ukranian is tea            #5
                if milk is middle             #9
                for (OldGold, Kools, Chesterfields, LuckyStrike, Parliaments) in orderings
                if Kools is yellow            #8
                if LuckyStrike is oj          #13
                if Japanese is Parliaments    #14
                for (dog, snails, fox, horse, ZEBRA) in orderings
                if Spaniard is dog            #3
                if OldGold is snails          #7
                if nextto(Chesterfields, fox) #12
                if nextto(Kools, horse)       #11
        )

    def imright(h1, h2):
        "House h1 is immediately right of h2 if h1-h2 == 1."
        return h1-h2 == 1

    def nextto(h1, h2):
        "Two houses are next to each other if they differ by 1."
        return abs(h1-h2) == 1

    print(zebra_puzzle())

Let's take a moment to understand this code. This solution represents each house as an integer. It generates all permutations of houses, and then self-joins these permutations (called ``orderings``) repeatedly. On each join, it binds each integer to an attribute name, like 'Englishman', 'red', or 'coffee'. Each requirement in the above problem description is then a simple integer equality check. It applies each requirements as early as possible to filter out invalid permutations.

In my opinion, this is an incredibly readable and concise solution compared to the existing C# solution, and its fast execution time (a couple of milliseconds) shows that you don't always need a high-powered logic engine if you're dealing with a relatively small number of possible solutions. I wanted to solve this problem in a similar way, in C#. It ended up being an interesting tour through some new C# 7 features.

C# Implementation
=================

Since we'll be using some new C# 7 features in this post, if you're following along at home, you'll want to do the following:

1. Download the most recent Visual Studio 2017 release (currently in RC). This will also install the latest pre-release version of C# 7.
2. Create a new solution, and install the ``System.ValueTuple`` pre-release Nuget package. This will enable some additional C# 7 features.

First up, let's knock out the easy part: writing the helper functions. Nothing too interesting here, it's just a straightforward translation of the python helper functions:

.. code-block:: csharp

    /// <summary>
    /// Is house h1 immediately right of h2?
    /// </summary>
    static bool ImmediatelyRight(int h1, int h2) => h1 - h2 == 1;

    /// <summary>
    /// Are house h1 and h2 next to each other?
    /// </summary>
    static bool NextTo(int h1, int h2) => Math.Abs(h1 - h2) == 1;

New C# 7 feature: Deconstruction
================================

Next, we need to set up the initial house variables. The python version uses destructuring here, so we do the same, using C# 7's `new deconstruction feature`_ on the second line:

.. code-block:: csharp

    // set up the houses
    int[] houses = { 1, 2, 3, 4, 5 };
    (int first, _, int middle, _, _) = houses;

The above deconstruction statement splits the ``houses`` array into 5 separate variables. We only care about the first and middle houses, so we discard the other variables by using the underscore discard variable in their places.

However, if we write that exact code, it won't compile! C# doesn't know how to deconstruct an array. We can teach C# how to do this by writing a ``Deconstruct`` extension method for arrays:

.. code-block:: csharp

    public static void Deconstruct<T>(this T[] array, out T first, out T second, out T third, out T fourth, out T[] rest)
    {
        first = array[0];
        second = array[1];
        third = array[2];
        fourth = array[3];
        rest = array.Skip(4).ToArray();
    }

Any type can implement ``Deconstruct`` as a method or extension method, and it will then be able to take part in the new C# 7 deconstruction syntax. This method we just wrote only works for deconstructing into 5 variables, but that's all we need right now. Additional extension methods for array deconstruction can be found `in this gist`_.

New C# 7 feature: Tuples
========================

Our last step is to translate the Python list comprehension into a C# LINQ statement. What we'd like to write is something like this:

.. code-block:: csharp

    // this code does NOT work
    var answers =
        from (Red, Green, Ivory, Yellow, Blue) in orderings
        //... etc.

It would be nice if C# 7 recognized our ``Deconstruct`` method and it all Just Worked. However, C# 7 doesn't support deconstruction in LINQ statements (see the `issue tracking it`_), so we can't quite do this yet.

There's a workaround: rather than deconstructing inside the LINQ statement, we can represent our permutations as a list of ``System.ValueTuples``.

``System.ValueTuple`` isn't related to the existing ``System.Tuple`` type. A ``System.ValueTuple`` is different in that you can optionally name its tuple members (no more Item1, Item2, etc!). It can also be returned from a method and retain those member names, unlike an anonymous type.

In our initial permutation list, we won't name the tuple members:

.. code-block:: csharp

    var orderings =
        // generates List<List<int>> using the Combinatorics nuget package
        new Permutations<int>(houses)
        // creates List<System.ValueTuple<int, int, int, int, int>>
        .Select(p => (p[0], p[1], p[2], p[3], p[4])).ToList();

We can then provide helper functions to translate unnamed tuples into named tuples for each house attribute:

.. code-block:: csharp

    (int Red, int Green, int Ivory, int Yellow, int Blue)
        AsColors((int, int, int, int, int) permutation) => permutation;

    (int Englishman, int Spaniard, int Ukranian, int Japanese, int Norwegian)
        AsNationalities((int, int, int, int, int) permutation) => permutation;

    (int Coffee, int Tea, int Milk, int OJ, int Water)
        AsDrinks((int, int, int, int, int) permutation) => permutation;

    (int OldGold, int Kools, int Chesterfields, int LuckyStrike, int Parliaments)
        AsCigarettes((int, int, int, int, int) permutation) => permutation;

    (int Dog, int Snail, int Fox, int Horse, int Zebra)
        AsPets((int, int, int, int, int) permutation) => permutation;

With the above workaround in place, it's now a straightforward translation of the original problem description, complete with static typing goodness:

.. code-block:: csharp

    // solve the problem
    var answers =
        from color in orderings.Select(AsColors)
        where ImmediatelyRight(color.Green, color.Ivory) //6
        from nationality in orderings.Select(AsNationalities)
        where nationality.Englishman == color.Red &&     //2
              nationality.Norwegian == first &&          //10
              NextTo(nationality.Norwegian, color.Blue)  //15
        from drink in orderings.Select(AsDrinks)
        where drink.Coffee == color.Green &&             //4
              drink.Tea == nationality.Ukranian &&       //5
              drink.Milk == middle                       //9
        from smoke in orderings.Select(AsCigarettes)
        where smoke.Kools == color.Yellow &&             //8
              smoke.LuckyStrike == drink.OJ &&           //13
              nationality.Japanese == smoke.Parliaments  //14
        from pet in orderings.Select(AsPets)
        where nationality.Spaniard == pet.Dog &&         //3
              smoke.OldGold == pet.Snail &&              //7
              NextTo(smoke.Chesterfields, pet.Fox) &&    //12
              NextTo(smoke.Kools, pet.Horse)             //11
        select new { drink.Water, pet.Zebra };

    var answer = answers.Single();
    Console.WriteLine($"Water drinker lives in {answer.Water} and zebra owner lives in {answer.Zebra}");

Running this, we get the output:

    Water drinker lives in 1 and zebra owner lives in 5

And we're done! We found that sneaky zebra owner.

Conclusion
==========

Overall, I feel like this LINQ implementation is fairly faithful to the original Python implementation, and in about 70 lines of code. If LINQ supported deconstruction, I would be 100% happy with it. However, due to the lack of LINQ support, we needed a couple of helper functions, and that definitely spoiled the fun a bit.

``System.ValueTuple`` looks like a very useful feature -- but I'll need to be careful to balance this with code readability concerns. Sometimes it might be better to break a ``System.ValueTuple`` into a named class with documentation. For cases like this blog post though, where the types are only ever used inside a single method or class, I think it's a valuable feature.


.. _the Zebra puzzle: https://en.wikipedia.org/wiki/Zebra_Puzzle
.. _a long list of programs available to solve it: http://rosettacode.org/wiki/Zebra_puzzle
.. _Peter Norvig: https://en.wikipedia.org/wiki/Peter_Norvig
.. _Udacity CS212: https://www.udacity.com/wiki/cs212/unit-2
.. _in this gist: https://gist.github.com/waf/280152ab42aa92a85b79d6dbc812e68a
.. _issue tracking it: https://github.com/dotnet/roslyn/issues/13964
.. _new deconstruction feature: https://github.com/dotnet/roslyn/blob/master/docs/features/deconstruction.md
.. _Tuples: https://github.com/dotnet/roslyn/blob/master/docs/features/tuples.md
