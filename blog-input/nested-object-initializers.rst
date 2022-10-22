A Lesser-Known C# Feature: Nested Object Initializers
#####################################################

:date: 2020-12-12
:tags: csharp, language
:commentid: 3

I've been writing C# for quite some time now, but only recently found out about the "nested object initializers" syntax in C#. Nested object initializers elegantly solve problems for which I've previously used workarounds. It's not a new feature; it was introduced in C# 3.0, under section 7.5.10.2 of the language specification:

    An object initializer after the equals sign is a nested object initializer, i.e. an initialization of an embedded object. Instead of assigning a new value to the field or property, the assignments in the nested object initializer are treated as assignments to members of the field or property. 

In case the above specification is not clear, we'll work through an example. C# has several types of initializer syntax, among which are object initializers and collection initializers. Nested object initializers could be considered a specialization of both.

Reviewing Object and Collection Initializers
============================================

Before diving into nested object initializers, let's review object initializers and collection initializers. These initializers provide a convenient syntax for object construction; they technically construct an "empty" object and then mutate that object as part of the initialization. Here's an example of both:

.. code-block:: csharp

    // given classes defined like this:
    class Company
    {
        public Person Ceo { get; set; }
        public IList<Person> Employees { get; set; }
    }
    class Person
    {
        public string Name { get; set; }
    }

    // an object initializer for Company
    var apple = new Company
    {
        // an object initializer for Person
        Ceo = new Person { Name = "Tim Cook" },
        // a collection initializer:
        Employees = new List<Person>
        {
            new Person { Name = "Joe" },
            new Person { Name = "Janet" },
            new Person { Name = "John" },
        }
    };

In the above example, the object initializer is used to initialize both the ``Company`` object and the ``Person`` objects. The collection initializer is used to create a new ``List<Person>`` and add 3 entries to it. Collection initializers can initialize any object that implements ``IEnumerable`` and contains an ``Add`` method (either as part of the type, or as an extension method).

Nested Object Initializers
==========================

Now, how do nested object initializers tie into this? In the previous code example, we were creating new objects (a new ``Person`` for the ``Company.Ceo`` property, and a new ``List<Person>`` for the ``Company.Employees`` property). Nested object initializers allow for **mutating default values** in the class.

Let's alter our class definition above. We all know that null values are a pain, so we could set default values for each property, and use nested object initializers during object construction:

.. code-block:: csharp

    class Company
    {
        public Person Ceo { get; set; } = new Person();
        public IList<Person> Employees { get; set; } = new List<Person>();
    }

    var apple = new Company
    {
        Ceo = { Name = "Tim Cook" },
        Employees =
        {
            new Person { Name = "Joe" },
            new Person { Name = "Janet" },
            new Person { Name = "John" },
        }
    }

With the nested object initializer syntax, we remove the reference to the constructors for both properties, and it will mutate the existing, default value.

Where is this useful?
========================

The nested object initializer implies mutation of existing values, so it shouldn't be used everywhere; I prefer immutability where possible. However, there are still a few areas where this could be useful.

For nested object initializers with collection initializers, this helps resolve a conflict between wanting to use object initializers, and wanting to `prefer empty collections over null collections`_. This was always a bit of a conflict for me.

For nested object initializers with object initializers, this could help in configuration scenarios, where we want to have some default configuration object. In this case, the nested object initializer could be used to override these default configuration values.

Learning more
=============

The best documentation for this seems to be the `C# Language Reference`_. There's also a `GitHub issue`_ asking for better documentation on this feature. I personally found the chat rooms available on gitter very helpful for learning more about this feature; special thanks to `HaloFour`_, `Joe4evr`_ and `jnm2`_ for helping out!

.. _prefer empty collections over null collections: https://docs.microsoft.com/en-us/dotnet/standard/design-guidelines/guidelines-for-collections#collection-properties-and-return-values
.. _C# Language Reference: https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/expressions#object-initializers
.. _GitHub issue: https://github.com/dotnet/docs/issues/12979
.. _jnm2: https://github.com/jnm2
.. _HaloFour: https://github.com/HaloFour
.. _Joe4evr: https://github.com/Joe4evr
