Injecting a C# REPL into a running .NET process
###############################################

:date: 2026-06-28
:tags: csharp, dotnet, cli, csharprepl
:commentid: 8

I've been building `CSharpRepl`_ on and off for about five years. It's a command-line `REPL`_ for C# with syntax highlighting, intellisense, and NuGet package support.

A recent addition lets it connect to *another* already-running .NET process and evaluate C# inside it. Unlike a debugger, which pauses the process and does expression evaluation, CSharpRepl injects a C# script engine into the target and runs unconstrained C# against the application's live state, without pausing the application. You can read and write statics, resolve services from the application's DI container, and replace or wrap methods without restarting the process.

.. warning::

    Connecting to a process and injecting the REPL is equivalent to running arbitrary code inside it, with its privileges. This is a development and diagnostics tool meant to run on your own computer. Never enable it on a production process.

To demonstrate, let's build a small app with a bug in it, then connect to it with CSharpRepl and check things out.

A weather API with a bug
=========================

We'll start from the default ASP.NET Core Web API template:

.. code-block:: console

    dotnet new webapi -o WeatherApi

The default template is a weather API with some static weather data. Let's make it a little more interesting (and a little broken). We'll generate the weather randomly, cache today's forecast in an ``IMemoryCache``, and add a subtle bug. Replace the contents of ``Program.cs`` with this:

.. code-block:: csharp

    using Microsoft.Extensions.Caching.Memory;

    var builder = WebApplication.CreateBuilder(args);
    builder.Services.AddMemoryCache();
    builder.Services.AddSingleton<WeatherService>();

    var app = builder.Build();
    app.MapGet("/weather", (WeatherService weather) => weather.Today());
    app.Run();

    class WeatherService(IMemoryCache cache)
    {
        private static readonly string[] summaries =
            ["Freezing", "Bracing", "Chilly", "Mild", "Warm", "Balmy", "Hot", "Scorching"];

        public object Today() => cache.GetOrCreate("today", entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30);
            var c = Random.Shared.Next(-20, 56); // -20°C to 55°C
            return new
            {
                Date = DateOnly.FromDateTime(DateTime.Now),
                Celsius = c,
                Fahrenheit = 32 + c * 9 / 5,
                Summary = PickWeatherSummary(summaries, c),
            };
        })!;

        // Pick a summary from coldest to hottest, scaled from the -20..55°C range.
        public static string PickWeatherSummary(string[] summaries, int c) =>
            summaries[(int)((c + 20) / 75.0 * summaries.Length)];
    }

The interesting part is ``PickWeatherSummary``. It normalizes the temperature to 0..1 and multiplies it by ``summaries.Length`` to pick a weather summary, sorted coldest to hottest.

The bug is in the multiplier; at the top of temperature range the normalized value becomes ``1.0``, so after multiplying by the length, the index is 1 past the end of the array. If the temperature is 55°C, it throws an ``IndexOutOfRangeException``. Though at this scorching temperature, a sporadic exception might be the least of your worries.

Since the temperature is random and the result is cached for thirty seconds, the endpoint mostly works, then HTTP 500s for half a minute whenever a forecast happens to hit 55°C. While ideally our unit tests should have caught this, it would be annoying to reproduce locally, so it's a good excuse to demo CSharpRepl's ``connect`` functionality.

Letting CSharpRepl in
=====================

The target application's source doesn't need to change, but the process does have to opt-in by launching with two environment variables set. CSharpRepl can print the right ones for your shell:

.. code-block:: bash

    $ csharprepl connect init        # autodetects your shell, or pass e.g. --shell pwsh
    # Run in the shell that launches your app, then start it and note its process id:
    # Do NOT set them as system-wide or user-wide environment variables; only set them in the shell.
    export DOTNET_STARTUP_HOOKS=".../tools/csharprepl/.../connector/CSharpRepl.InjectedHook.dll"
    export ASPNETCORE_HOSTINGSTARTUPASSEMBLIES="CSharpRepl.InjectedHook"

Set those variables in your current shell, then run the application via ``dotnet run`` in that *same shell* so the application inherits them (don't set them permanently; you only want them where you're about to start the target application).

In another terminal, hit the endpoint. Most of the time you get a forecast back:

.. code-block:: console

    $ curl -s localhost:5000/weather
    {"date":"2026-06-28","celsius":17,"fahrenheit":62,"summary":"Mild"}

Rarely, though, a generated forecast hits 55°C and the request fails:

.. code-block:: console

    $ curl -s -i localhost:5000/weather | head -1
    HTTP/1.1 500 Internal Server Error

with a matching entry in the application's log:

.. code-block:: text

    System.IndexOutOfRangeException: Index was outside the bounds of the array.
       at WeatherService.PickWeatherSummary(String[] summaries, Int32 c) in Program.cs:line 31
       at WeatherService.<Today>b__3_0(ICacheEntry entry) in Program.cs:line 20
       at Microsoft.Extensions.Caching.Memory.CacheExtensions.GetOrCreate[TItem](...)
       at WeatherService.Today() in Program.cs:line 16

Now let's connect to the process with CSharpRepl and find out why.

Connecting to the process
=========================

Running ``connect list`` shows the opted-in processes, along with the process IDs:

.. code-block:: console

    $ csharprepl connect list
      PID  │ Process
     ─────┼──────────────
      6579 │ dotnet
      6580 │ WeatherApi

    Connect with csharprepl connect <PID>.
    Hint: you most likely want to connect to the 'WeatherApi' process (PID 6580).

We can see two processes: the dotnet host and our own application. The output hints that we most likely want to connect to our own application. Connect to the process by ID and we'll be in a REPL inside that process:

.. code-block:: console

    $ csharprepl connect 6580
    Connecting to the connector in process 6580...
    Connected to WeatherApi (pid 6580)
      Runtime:   .NET 10.0.7
      Connector: v1.0.0.0 (protocol v2)
      DI provider captured: yes, services and Get<T>() are available.

    6580>

It looks like a normal CSharpRepl prompt (except the input prompt shows the target's process ID). It supports intellisense, highlighting, and pretty-printing, and the code we run is executed *inside the web app*, compiled against its types and with access to its live objects.

Reading and writing live application state
==========================================

The intermittent failures seem related to caching, so let's look at what the running app currently has cached. ``IMemoryCache`` is a service registered in the app's DI container, and CSharpRepl captures the application's service provider, so we can call ``services.GetRequiredService<T>()`` or the ``Get<T>()`` shorthand:

.. code-block:: csharp

    6580> using Microsoft.Extensions.Caching.Memory;
    6580> var cache = Get<IMemoryCache>();
    6580> cache.TryGetValue("today", out var forecast); forecast
    { Date = [6/28/2026], Celsius = 17, Fahrenheit = 62, Summary = Mild }

This is the actual object being served to clients right now. We can write to that state too; for example, evicting the cached entry will force the next request to regenerate:

.. code-block:: csharp

    6580> cache.Remove("today")

Reproducing the bug on demand
=============================

From outside the process, a random failure like this is hard to reproduce. Inside it, we can call the method directly with the input we suspect:

.. code-block:: csharp

    6580> string[] summaries = ["Freezing", "Bracing", "Chilly", "Mild", "Warm", "Balmy", "Hot", "Scorching"];
    6580> WeatherService.PickWeatherSummary(summaries, 55)
    System.IndexOutOfRangeException: Index was outside the bounds of the array.

We can reproduce the exact failure now, inside the running process. At 55°C the scaled number is exactly ``1.0``, so the index becomes ``8``, which is one past the last entry in the array.

Replacing the method live
=========================

We can validate our fix by building up a working method in the REPL, and then replacing the live method with our corrected version, all without rebuilding or losing the application's state.

First, define a replacement with a signature that matches the target method's parameters. When replacing an instance method, provide the instance as an extra first parameter. But in this case ``PickWeatherSummary`` is static function, so it's not needed:

.. code-block:: csharp

    6580> string FixedSummary(string[] summaries, int c) =>
              summaries[(int)((c + 20) / 75.0 * (summaries.Length - 1))];

Then swap it in for the original method using ``#replace``:

.. code-block:: csharp

    6580> #replace WeatherService.PickWeatherSummary with FixedSummary

The patch takes effect immediately. We can confirm the crash is fixed by calling the method that we replaced, seeing our new code running, and then evicting the cached forecast (writing to live state again):

.. code-block:: csharp

    6580> WeatherService.PickWeatherSummary(summaries, 55)
    "Scorching"
    6580> Get<IMemoryCache>().Remove("today")

Now ``curl localhost:5000/weather`` works even when the randomly generated temperature is 55°C. The patch only lives in this process and disappears when the process exits, so the real fix still needs to be added to the source.

Wrapping a method to watch it
=============================

In addition to replacing a method outright, we can also leave the original method intact and just observe it. We can do that with the ``#wrap`` command. The wrapper is a function that mirrors the function you want to wrap, but takes an ``orig`` delegate as its first parameter. Invoking that ``orig`` delegate then invokes the original method:

.. code-block:: csharp

    6580> string logged(Func<string[], int, string> orig, string[] summaries, int c)
          {
              var summary = orig(summaries, c);
              Console.WriteLine($"PickWeatherSummary({c}) = {summary}");
              return summary;
          }
    6580> #wrap WeatherService.PickWeatherSummary with logged

Every call now logs its argument and result to the application's own console, which is a quick way to add instrumentation.

Cleaning up
===========

Patches persist in the target until you revert them or the process exits. They will survive if you close the REPL and reconnect later. There are a few commands for managing patches:

- ``#patches`` lists what's active and gives assigns a unique number per patch
- ``#revert`` will undo the patch -- either provide the patch's number or the word ``all`` to undo them all.

A few limitations
=================

I've tested this with a range of complex applications and it's been working well, though I'm sure there are cases where it doesn't work. If you find one, feel free to open a bug report in the CSharpRepl GitHub repository. The known limitations right now are:

- I've only tested this on ``net10.0`` targets, and I'm unlikely to support older .NET versions.
- Method replacement can't (yet?) touch generic methods, pointer parameters, or call sites the JIT has already inlined.
- Single-file published apps have limited support; you can still connect to them, but you need to use reflection for everything. This is because the bundled assemblies don't have on-disk metadata.

Learning more
=============

If you want to try this out, install CSharpRepl as a dotnet tool via:

.. code-block:: console

    dotnet tool install -g csharprepl

Or update an existing install with ``dotnet tool update -g csharprepl``.

There's a documentation on how the injection works under-the-hood (the startup hook, isolated assembly-load contexts, and the wire protocol) in the `Injected Hook documentation`_, and the rest of the project lives `on GitHub`_.

.. _CSharpRepl: https://github.com/waf/CSharpRepl
.. _REPL: https://en.wikipedia.org/wiki/Read%E2%80%93eval%E2%80%93print_loop
.. _Injected Hook documentation: https://github.com/waf/CSharpRepl/blob/main/InjectedHook/InjectedHookReadme.md
.. _on GitHub: https://github.com/waf/CSharpRepl
