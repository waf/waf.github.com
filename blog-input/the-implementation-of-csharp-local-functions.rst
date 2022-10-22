The Implementation of C# Local Functions
########################################

:date: 2017-07-26
:tags: csharp, language

C# 7 local functions provide a more intuitive syntax over creating verbose System.Func delegates, as well as being more capable (they support ref and out parameters, async, generics, etc). In addition, some articles have mentioned that local functions compile down to normal methods, thus reducing GC allocations when compared to System.Func.

I was curious about that last part. How does it work? Let's open up the dotPeek decompiler and find out!

First, here's a simple test program using a local function:

.. code-block:: csharp

    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine(AddFive(7));
        }

        static int AddFive(int a)
        {
            // the local function declaration
            int InnerAdd(int b) => a + b;

            return InnerAdd(5);
        }
    }

Admittedly, the above local function is not really needed in this case, but it's simple enough code that the decompilation won't be scary!

Decompiling the Program
=======================

After decompiling the above program, we get the following for the ``AddFive`` method:

.. code-block:: csharp

    public static int AddFive(int a)
    {
        // object of a compiler-generated type is created
        // reference to a compiler-generated method
        return Program.<AddFive>g__InnerAdd1_0(5, ref new Program.<>c__DisplayClass1_0()
        {
            a = a
        });
    }

The above comments are helpfully added by the decompiler. As we can see, the C# compiler created the following for us:

- ``Program.<AddFive>g__InnerAdd1_0`` -- this is our InnerAdd function, converted to a normal static function in the Program class.  <AddFive> is simply part of the name, it's not a generic type. Note that if the enclosing method is an instance method, the generated function will be an instance method.
- ``Program.<>c__DisplayClass1_0`` -- This is a generated class. It captures the ``a`` parameter, and is passed by reference into our function.

Inspecting the Intermediate Language (IL)
=========================================

In order to look into the generated class and function, we need to look at the IL code. Here is the IL code for the generated class that captures the ``a`` parameter:

.. code-block:: csharp

    .class nested private sealed auto ansi beforefieldinit 
      '<>c__DisplayClass1_0'
        extends [mscorlib]System.ValueType
    {
      .custom instance void
        [mscorlib]System.Runtime.CompilerServices.CompilerGeneratedAttribute::.ctor() 
        = (01 00 00 00 )

      .field public int32 a
    }

Two interesting things about this are that it only has one field, ``int32 a``, that is used to pass our ``a`` parameter to the function, and that the class extends from System.ValueType_. System.ValueType is the base class for all value types, so the generated value type will not cause heap allocations. The C# compiler prevents user code from extending System.ValueType.

Next, let's look at the generated method:

.. code-block:: csharp

    .method assembly hidebysig static int32 
        '<AddFive>g__InnerAdd1_0'(
          int32 b, 
          [in] valuetype Demo.Program/'<>c__DisplayClass1_0'& obj1
        ) cil managed 
      {
        .custom instance void
          [mscorlib]System.Runtime.CompilerServices.CompilerGeneratedAttribute::.ctor() 
          = (01 00 00 00 )
        .maxstack 8

        IL_0000: ldarg.1      // obj1
        IL_0001: ldfld        int32 Demo.Program/'<>c__DisplayClass1_0'::a
        IL_0006: ldarg.0      // b
        IL_0007: add          
        IL_0008: ret          

      } // end of method Program::'<AddFive>g__InnerAdd1_0'
    } // end of class Demo.Program

Despite being a bit long, this is pretty straight-forward. It's a static function that takes two parameters, ``int b`` and our generated ``obj1``. It loads our argument obj1 onto the stack, then loads field ``obj1.a``, then loads our argument ``b``. Next, it calls add, which pops the top two values off the stack and adds them, then pushes the result back on the stack. Finally, it calls ``ret`` to return that result.

Adding More Complexity
======================

Let's make things a bit more interesting. What if our nested function mutates (*gasp*)?

.. code-block:: csharp

    public static int AddFive(int a)
    {
        void InnerAdd(int b) => a += b;

        InnerAdd(5);

        return a;
    }

The ``InnerAdd`` function is now a ``void`` function, that mutates ``a`` in the outer scope. In this case, our decompiled AddFive function looks like this:

.. code-block:: csharp

    public static int AddFive(int a)
    {
       // object of a compiler-generated type is created
       Program.<>c__DisplayClass1_0 cDisplayClass10 = new Program.<>c__DisplayClass1_0();
       // reference to a compiler-generated field
       cDisplayClass10.a = a;
       // reference to a compiler-generated method
       Program.<AddFive>g__InnerAdd1_0(5, ref cDisplayClass10);
       // reference to a compiler-generated field
       return cDisplayClass10.a;
    }

This is more interesting than the first case. We can see that our generated class is set up ahead of time, then passed into the generated static function, and then all subsequent references to the parameter ``a`` are rewritten into references to the generated field! Fascinating.


.. _System.ValueType: https://msdn.microsoft.com/en-us/library/system.valuetype(v=vs.110).aspx#Anchor_4

